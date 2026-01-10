import "dotenv/config";
import { env } from "node:process";
import { PrismaClient } from "../../src/prisma/generated/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Collection, Client as DiscordClient, GatewayIntentBits, Message } from "discord.js";
import fs from "node:fs";

type SlimMessage = {
  id: string;
  createdTimestamp: number;
  content: string;
  authorId: string;
  editedTimestamp?: number;
  attachmentUrls?: string[];
};

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}
if (!env.DISCORD_BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN is not set in environment variables");
}
if (!env.REGERINGEN_GUILD_ID) {
  throw new Error("REGERINGEN_GUILD_ID is not set in environment variables");
}
if (!env.QUOTE_CHANNEL_ID) {
  throw new Error("QUOTE_CHANNEL_ID is not set in environment variables");
}

const discordClient = new DiscordClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});
const dbURL = new URL(env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: dbURL.hostname,
  port: Number(dbURL.port),
  user: dbURL.username,
  password: dbURL.password,
  database: dbURL.pathname.slice(1),
});
const prisma = new PrismaClient({ adapter });
const users = Object.fromEntries((
  await prisma.user.findMany()
).map((u) => [u.id, u]));

main()
  .then(() => {
    console.info("Script completed successfully.");
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error("An error occurred during script execution:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await discordClient.destroy();
    await prisma.$disconnect();
  });

async function main() {
  const quotes: Message[] = [];

  // Get quotes
  if (fs.existsSync("scripts/discord/quotes.json")) {
    const data = fs.readFileSync("scripts/discord/quotes.json", "utf-8");
    const parsedQuotes = JSON.parse(data) as Message[];
    quotes.push(...parsedQuotes);
    console.info(`Loaded ${quotes.length} quotes from existing file.`);
  }
  else {
    const fetchedQuotes = await getAndSaveQuotes();
    quotes.push(...fetchedQuotes);
  }

  const mediaLink = (attachmentId: string) =>
    `https://cdn.discordapp.com/attachments/${env.QUOTE_CHANNEL_ID}/${attachmentId}`;

  // Trim quotes
  const trimmed: SlimMessage[] = [];
  for (const quote of quotes) {
    const attachments = Array.from(quote.attachments.values()) as unknown as string[];
    try {
      trimmed.push({
        id: quote.id,
        // This is horrible, the discord.js types are slightly broken so it is what it is :woman_shrugging:
        authorId: (quote as unknown as { authorId: string; }).authorId || quote.author.id,
        content: quote.content,
        createdTimestamp: quote.createdTimestamp,
        ...quote.editedTimestamp ? { editedTimestamp: quote.editedTimestamp } : {},
        ...attachments.length > 0 ? { attachmentUrls: attachments.map(mediaLink), } : {},
      });
    }
    catch (e) {
      console.warn("Error converting message", quote);
      console.error(e);
    }
  }

  // Save trimmed quotes
  fs.writeFileSync("scripts/discord/quotes_trimmed.json", JSON.stringify(trimmed, null, 2));
  console.info(`Saved ${trimmed.length} trimmed quotes to file.`);

  // Starting character analysis
  const everyStartCharacter = trimmed.map(q => q.content.charAt(0));
  const startCharacterCounts: Record<string, number> = {};
  for (const char of everyStartCharacter) {
    startCharacterCounts[char] ??= 0;
    startCharacterCounts[char]++;
  }
  console.info("These are all the starting characters used in quotes:");
  console.dir(startCharacterCounts, { depth: null });

  // Normalize
  const quoteChars = ["\"", "”", "“"];
  const nonQuoted = trimmed.filter(q =>
    !quoteChars.includes(q.content.charAt(0))
  );

  if (nonQuoted.length > 0) {
    console.warn(`Quotes not starting with a quote character ${nonQuoted.length}, [${nonQuoted.map(q => q.id).join(", ")}]`);
    fs.writeFileSync("scripts/discord/non_quoted_quotes.json", JSON.stringify(nonQuoted, null, 2));
    console.info("Wrote non-quoted quotes to scripts/discord/non_quoted_quotes.json");
  }

  const normalizedQuotes: SlimMessage[] = trimmed.map(q => ({
    ...q,
    content: q.content.replace(/“|”/g, "\"").trim(),
  }));
  const duplicateMap: Record<string, SlimMessage[]> = {};
  for (const quote of normalizedQuotes) {
    const key = quote.content.toLowerCase();
    duplicateMap[key] ??= [];
    duplicateMap[key].push(quote);
  }

  const duplicates = Object.values(duplicateMap).filter(dupeList => dupeList.length > 1);
  if (duplicates.length > 0) {
    console.warn(`Found ${duplicates.length} sets of duplicate quotes:`);
    for (const dupeSet of duplicates) {
      console.group("Duplicate set:");
      for (const dupe of dupeSet) {
        console.log(`- [${dupe.id}] ${dupe.content}`);
      }
      console.groupEnd();
    }
    fs.writeFileSync("scripts/discord/duplicate_quotes.json", JSON.stringify(duplicates, null, 2));
    console.info("Wrote duplicate quotes to scripts/discord/duplicate_quotes.json");
  }

  // Add link to normalized
  const messageLink = (quoteId: string) =>
    `https://discord.com/channels/${env.REGERINGEN_GUILD_ID}/${env.QUOTE_CHANNEL_ID}/${quoteId}`;

  const withLinks = normalizedQuotes.map(q => ({
    ...q,
    link: messageLink(q.id),
  }));

  const withContext = withLinks.map(extractContext);

  // Save normalized quotes
  fs.writeFileSync("scripts/discord/quotes_normalized.json", JSON.stringify(withContext, null, 2));
  console.info(`Saved ${withContext.length} normalized quotes to file.`);
}

function extractContext(quote: SlimMessage) {
  const sender = users[quote.authorId];
  if (!sender) {
    throw new Error("Could not find user with ID " + quote.authorId);
  }

  const isMultiLine = quote.content.includes("\n");
  if (isMultiLine) return quote;

  let [body, context] = quote.content.split(/(?<="[^"]+?"\s*)-(?=\s*\w+)/).map(s => s.trim());

  if (!body.endsWith("\"")) {
    throw new Error("Failed to parse quote body, missing quote: " + body + " (full content: " + quote.content + ")");
  }
  // Normalize whitespace
  body = body.replace(/\s+/g, " ");
  // Special case: Add quotes around body 
  if ([
    "1187409400349069432",
  ].includes(quote.id)) {
    body = `"${body.trim()}"`;
  }
  // Trim surrounding quotes
  body = body.slice(1, -1).trim();

  const contextDividers = [
    ", ",
    " i ",
    " om ",
    " när ",
    " till ",
    " som ",
    " efter ",
    " medan ",
  ];

  return {
    ...quote,
    sender: sender.name,
    body,
  };
}

async function getAndSaveQuotes(): Promise<Message[]> {
  await discordClient.login(env.DISCORD_BOT_TOKEN);
  const guild = await discordClient.guilds.fetch(env.REGERINGEN_GUILD_ID!);
  if (!guild) {
    throw new Error("Could not find guild with ID " + env.REGERINGEN_GUILD_ID);
  }
  const quoteChannel = await guild.channels.fetch(env.QUOTE_CHANNEL_ID!);
  if (!quoteChannel?.isTextBased()) {
    throw new Error("Could not find text channel with ID " + env.QUOTE_CHANNEL_ID);
  }

  const quotes: Message[] = [];

  const maxPages = 100;
  let lastId: string | undefined = undefined;
  for (let i = 0; i < maxPages; i++) {
    const messages: Collection<string, Message<true>> = await quoteChannel.messages.fetch({
      limit: 100,
      before: lastId,
    });
    if (messages.size === 0) {
      break;
    }
    lastId = messages.last()?.id;
    quotes.push(...(messages.values() as IterableIterator<Message>));
    console.info(`Fetched ${quotes.length} messages so far...`);
  }

  const filteredQuotes = quotes.filter(q =>
    q.id !== "1167426858887958568"
    && !q.system
  );

  console.info(`Fetched a total of ${filteredQuotes.length} messages.`);

  const semiSerialized = filteredQuotes.map(q => ({
    ...q,
    attachments: q.attachments.map(a => ({ ...a })),
    author: { ...q.author },
  }));

  fs.writeFileSync("scripts/discord/quotes.json", JSON.stringify(semiSerialized, null, 2));

  return semiSerialized as unknown as Message[];
}