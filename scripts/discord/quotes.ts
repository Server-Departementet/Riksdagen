import "dotenv/config";
import { argv, env } from "node:process";
import fs from "node:fs";
import { PrismaClient } from "../../src/prisma/generated/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Client as DiscordClient, GatewayIntentBits, Message } from "discord.js";
import { attachmentDir, getAttachmentPath, Quote, TrimmedMessage } from "./types.ts";
import { nameVariants } from "./name-variants.ts"

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
  const quotes: TrimmedMessage[] = await crawlQuotes();

  openingQuoteCharAnalysis(quotes);

  // Normalize content
  for (const quote of quotes) {
    quote.content = quote.content
      .replace(/”|“/g, "\"")
      .trim();
  }

  duplicateAnalysis(quotes);

  downloadAttachments(quotes)
    .catch((error) => {
      console.error("An error occurred while downloading attachments:", error);
    });

  const quotesWithContext: Quote[] = quotes.map(extractContext).filter(q => q !== null);

  // Save normalized quotes
  fs.writeFileSync("scripts/discord/quotes.json", JSON.stringify(quotesWithContext, null, 2));
  console.info(`Saved ${quotesWithContext.length} normalized quotes to file.`);
}

function extractContext(quote: TrimmedMessage): Quote | null {
  // TODO: Handle multi-line quotes
  const isMultiLine = quote.content.includes("\n");
  if (isMultiLine) return null;

  const sender = users[quote.authorId];
  if (!sender?.name) {
    throw new Error("Could not find user with ID " + quote.authorId);
  }

  // Regex finds the "-" between the quote body and the quotee to split on
  const brokenQuote = quote.content.split(/(?<="[^"]+?"\s*)-(?=\s*\w+)/).map(s => s.trim());
  if (brokenQuote.length !== 2) {
    console.warn("Could not parse quote content, skipping quote ID " + quote.id + ": " + quote.content);
    throw new Error("Failed to split quote into body and meta: " + quote.content);
  }
  let body = brokenQuote[0];
  const meta = brokenQuote[1];

  if (!body.endsWith("\"")) {
    throw new Error("Failed to parse quote body, missing quote: " + body + " (full content: " + quote.content + ")");
  }

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
    " som ",
    " till ",
    " efter ",
    " medan ",
  ];

  // Note: quotee is set as the entire meta at first and only overridden if a divider is found
  let [quotee, context]: [string, string?] = [meta.trim(), undefined];

  const dividableBy = contextDividers.find(div => {
    // Find the first instance of every divider
    const firstDividersByType: Record<string, number> = {};
    for (const divider of contextDividers) {
      const index = meta.indexOf(divider);
      if (index !== -1) {
        firstDividersByType[divider] = index;
      }
    }

    // Sort by index to find the earliest occurrence
    const sortedDividers = Object.entries(firstDividersByType).sort((a, b) => a[1] - b[1]);
    return sortedDividers[0]?.[0] === div;
  });

  // Define quotee and context via divider
  if (!context && dividableBy) {
    [quotee, context] = meta.split(dividableBy).map((s, i) => i === 0
      ? s.trim()
      // Kind ugly way to exempt , from being re-added to the context
      : (dividableBy === ", " ? "" : dividableBy + s).trim()
    );
  }

  // The trans clause
  if (context && [
    "1243112634371412060",
    "1334524370693128243",
    "1319605765614338118",
  ].includes(quote.id)) {
    context = context.replace(" han ", " hon ");
  }

  // Quotee normalization
  const aliases: Record<string, string> = {
    "Viggo": "Vena",
    "Viggos": "Venas",
    "Viggos mor": "Venas mamma",
    "Viggos mamma": "Venas mamma",
    "Viggos pappa": "Venas pappa",
  };

  // Apply aliases to quotee, body, and context
  if (aliases[quotee]) {
    quotee = aliases[quotee];
  }
  if (context) {
    for (const [alias, realName] of Object.entries(aliases)) {
      const regex = new RegExp(`\\b${alias}\\b`, "g");
      context = context.replace(regex, realName);
    }
  }
  body = body.replace(new RegExp(`\\b(${Object.keys(aliases).join("|")})\\b`, "g"), (match) => aliases[match]);

  // For our purposes we want to link quotees to user IDs where possible for easier use later
  const quoteeId = Object.entries(nameVariants).find(([, variants]) =>
    variants.map(v => v.toLowerCase()).includes(quotee.toLowerCase())
  )?.[0];

  return {
    id: quote.id,
    authorId: quote.authorId,
    createdTimestamp: quote.createdTimestamp,
    link: `https://discord.com/channels/${env.REGERINGEN_GUILD_ID}/${env.QUOTE_CHANNEL_ID}/${quote.id}`,
    sender: sender.name,
    body,
    quotee,
    ...(quoteeId ? { quoteeId } : {}),
    ...(context ? { context: context.trim() } : {}),
    ...(quote.attachmentUrls ? {
      attachments: quote.attachmentUrls.map(a => getAttachmentPath(quote, a))
    } : {}),
  };
}

function openingQuoteCharAnalysis(quotes: TrimmedMessage[]): void {
  const openingChars = quotes.map(q => q.content.charAt(0));
  const openingCharCounts: Record<string, number> = {};
  for (const char of openingChars) {
    openingCharCounts[char] ??= 0;
    openingCharCounts[char]++;
  }
  console.info("Opening quote character analysis:");
  console.dir(openingCharCounts, { depth: null });

  const validQuoteChars = ["\"", "”", "“"];
  const invalidStartQuotes = quotes.filter(q =>
    !validQuoteChars.includes(q.content.charAt(0))
  );

  if (invalidStartQuotes.length > 0) {
    console.warn(`Quotes not starting with a quote character ${invalidStartQuotes.length}, [${invalidStartQuotes.map(q => q.id).join(", ")}]`);
    fs.writeFileSync("scripts/discord/quotes_invalid_quote_char.json", JSON.stringify(invalidStartQuotes, null, 2));
    console.info("Wrote non-quoted quotes to scripts/discord/non_quoted_quotes.json");
  }
}

function duplicateAnalysis(quotes: TrimmedMessage[]): void {
  const duplicateMap: Record<string, TrimmedMessage[]> = {};
  for (const quote of quotes) {
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
    fs.writeFileSync("scripts/discord/quotes_duplicates.json", JSON.stringify(duplicates, null, 2));
    console.info("Wrote duplicate quotes to scripts/discord/quotes_duplicates.json");
  }
}

/** 
 * Crawls discord for quotes in the quote channel, returns and saves them to a file.
 */
async function crawlQuotes(): Promise<TrimmedMessage[]> {
  // If cache exists, load from it
  const forceFetch = argv.includes("--fetch");
  if (!forceFetch && fs.existsSync("scripts/discord/quotes_cache.json")) {
    const data = fs.readFileSync("scripts/discord/quotes_cache.json", "utf-8");
    const parsedQuotes = JSON.parse(data) as TrimmedMessage[];
    console.info(`Loaded ${parsedQuotes.length} quotes from cache file.`);
    return parsedQuotes;
  }

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

  /* 
   * Walk and get every message in the quote channel
   */
  const maxPages = 100;
  let lastId: string | undefined = undefined;
  for (let i = 0; i < maxPages; i++) {
    const messages: Message[] = Array.from((await quoteChannel.messages.fetch({
      limit: 100,
      before: lastId,
    })).values());
    if (messages.length === 0) break;
    lastId = messages.at(-1)!.id;
    quotes.push(...messages);
    console.info(`Fetched ${quotes.length} messages so far...`);
  }

  const filteredQuotes = quotes.filter(q =>
    ![
      "1167426858887958568", // Formatting template message
      "1194736973265506425", // Trans guard :3
      "1310699198794039358", // Trans guard :3
      "1243110807135588443", // Trans guard :3
      "1327605624447438900", // Trans guard :3
      "1317076088484007979", // Trans guard :3
    ].includes(q.id)
    && !q.system // Pins and such
  );

  console.info(`Fetched a total of ${filteredQuotes.length} messages.`);

  const trimmed: TrimmedMessage[] = filteredQuotes.map(q => ({
    id: q.id,
    authorId: q.author.id,
    content: q.content,
    createdTimestamp: q.createdTimestamp,
    ...q.attachments?.size ? { attachmentUrls: Array.from(q.attachments.values()).map(a => a.url), } : {},
  }));

  fs.writeFileSync("scripts/discord/quotes_cache.json", JSON.stringify(trimmed, null, 2));

  return trimmed;
}

async function downloadAttachments(quotes: TrimmedMessage[]): Promise<void> {
  // Download attachments
  if (!fs.existsSync(attachmentDir)) {
    fs.mkdirSync(attachmentDir);
  }
  for (const quote of quotes) {
    if (!quote.attachmentUrls || quote.attachmentUrls.length === 0) continue;
    for (const attachmentUrl of quote.attachmentUrls) {
      const fileDest = getAttachmentPath(quote, attachmentUrl);

      if (fs.existsSync(fileDest)) {
        console.info(`Attachment already exists, skipping download: ${fileDest}`);
        continue;
      }

      console.info(`Downloading attachment from ${attachmentUrl} to ${fileDest}...`);
      const response = await fetch(attachmentUrl);
      if (!response.ok) {
        console.error(`Failed to download attachment from ${attachmentUrl}: ${response.status} ${response.statusText}`);
        continue;
      }

      fs.writeFileSync(fileDest, Buffer.from(await response.arrayBuffer()));
    }
  }
}