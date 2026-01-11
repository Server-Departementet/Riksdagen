import "dotenv/config";
import { env } from "node:process";
import { Client as DiscordClient, GatewayIntentBits, Message, MessageType, PollLayoutType, } from "discord.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../src/prisma/generated/index.js";
import fs from "node:fs";
import { Quote } from "./types.ts";

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}
if (!env.DISCORD_BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN is not set in environment variables");
}
if (!env.REGERINGEN_GUILD_ID) {
  throw new Error("REGERINGEN_GUILD_ID is not set in environment variables");
}
if (!env.QUIZ_CHANNEL_ID) {
  throw new Error("QUIZ_CHANNEL_ID is not set in environment variables");
}
if (!env.CANONICAL_URL) {
  throw new Error("CANONICAL_URL is not set in environment variables");
}

const isDryRun = process.argv.includes("--dry-run");
const discordClient = new DiscordClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessagePolls],
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
    console.info("Script finished successfully");
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error("Script failed with error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await discordClient.destroy();
    await prisma.$disconnect();
  });

async function main() {
  await discordClient.login(env.DISCORD_BOT_TOKEN);

  const guild = await discordClient.guilds.fetch(env.REGERINGEN_GUILD_ID!);
  if (!guild) {
    throw new Error("Could not fetch guild");
  }
  const channel = await guild.channels.fetch(env.QUIZ_CHANNEL_ID!);
  if (!channel) {
    throw new Error("Could not fetch quiz channel");
  }
  if (!channel?.isTextBased()) {
    throw new Error("Quiz channel is not a text-based channel");
  }

  const usedQuotesPath = "scripts/discord/quotes_used.json";
  if (!fs.existsSync(usedQuotesPath)) fs.writeFileSync(usedQuotesPath, "[]", "utf-8");
  const usedQuotes: string[] = JSON.parse(fs.readFileSync(usedQuotesPath, "utf-8")) as string[];

  const availableQuotes = (JSON.parse(fs.readFileSync("scripts/discord/quotes.json", "utf-8")) as Quote[])
    .filter(q => q.quoteeId);
  console.info(`Loaded ${availableQuotes.length} available quotes for quiz`);

  let quizNumber = 0;
  const latestMessages = await channel.messages.fetch({ limit: 100, });
  const lastQuiz = latestMessages
    .find((msg) =>
      msg.author.id === discordClient.user?.id
      && msg.type === MessageType.Default
      && msg.poll
      && msg.content.toLowerCase().startsWith("# citat quiz #")
    );
  if (lastQuiz) {
    // Get the quiz number
    const quizTitleNumber = /# citat quiz #(\d+)/.exec(lastQuiz.content.toLowerCase());
    if (quizTitleNumber) quizNumber = Number(quizTitleNumber[1]);

    // Quote Id is embedded in the quiz question content
    const previousQuoteId = /id: (\d+)/.exec(lastQuiz.content)?.[1];
    const previousQuote = availableQuotes.find(q => q.id === previousQuoteId);
    if (!previousQuote) {
      throw new Error("Could not find previous quote for quiz results");
    }

    // End previous poll early if still running
    await endPreviousPoll(lastQuiz);

    // Delete poll results message cause it's ugly and not helpful in a quiz with correct answers
    const pollResultMessages = (await channel.messages.fetch({ limit: 20, }))
      .filter(msg =>
        msg.author.id === discordClient.user?.id
        && msg.type === MessageType.PollResult
      );
    await Promise.all(pollResultMessages.map(msg => msg.delete()));

    /*
     * Compile and send quiz results
     */
    const answers = lastQuiz.poll!.answers;
    const correctAnswer = answers.find(answer => answer.text === users[previousQuote.quoteeId!].name);
    const correctVoters = await correctAnswer?.voters.fetch();
    const winningUsers = correctVoters ? Array.from(correctVoters.values()) : [];

    let resultContent = fs.readFileSync("scripts/discord/quiz-result-template.md", "utf-8");
    const quizResultData = {
      "quizNumber": quizNumber,
      "quotee": previousQuote.quotee,
      "quoteBody": previousQuote.body,
      "link": previousQuote.link,
      "winners": winningUsers.length
        ? winningUsers.map(u => `<@${u.id}>`).join(" ") + " som gissade rätt"
        : "*ingen...*",
    };
    for (const [key, value] of Object.entries(quizResultData)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      resultContent = resultContent.replace(regex, value.toString());
    }

    if (!isDryRun)
      await channel.send(resultContent);
    quizNumber += 1;
  }

  // Remove used quotes from available quotes after having selected previous quote
  for (const usedQuoteId of usedQuotes) {
    const index = availableQuotes.findIndex(q => q.id === usedQuoteId);
    if (index !== -1) {
      availableQuotes.splice(index, 1);
    }
  }
  console.info(`There are ${availableQuotes.length} quotes left to select from`);

  /* 
   * Select quote for new quiz 
   */
  const allQuotees = [...new Set(availableQuotes.map(q => q.quoteeId))];
  const randomQuotee = allQuotees[Math.floor(Math.random() * allQuotees.length)];
  const quotesSelection = availableQuotes.filter(q => q.quoteeId === randomQuotee);
  const quote = quotesSelection[Math.floor(Math.random() * quotesSelection.length)];

  // Save quote id to file to avoid repeating quotes
  usedQuotes.push(quote.id);
  fs.writeFileSync(usedQuotesPath, JSON.stringify(usedQuotes, null, 2), "utf-8");

  console.info(`Selected quote ID ${quote.id} for Quiz #${quizNumber}`);
  console.info(quote);

  /*
   * Make new quiz
   */
  const quizData = {
    "quizNumber": quizNumber,
    "quoteBody": quote.body,
    "date": new Date(quote.createdTimestamp).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    "sender": quote.sender,
    ...quote.context ? { "context": quote.context } : {},
    "quoteId": quote.id,
  };

  let quizContent = fs.readFileSync("scripts/discord/quiz-template.md", "utf-8");
  for (const [key, value] of Object.entries(quizData)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    quizContent = quizContent.replace(regex, value.toString());
  }

  // Remove line with {{context}} if no context is provided
  if (!quote.context) {
    quizContent = quizContent.replace(/^-# {2}sammanhang \|\|.*\|\|\n/m, "");
  }

  // Build embed image URLs from externally hosted attachments
  let embeds: { image: { url: string } }[] | undefined = undefined;
  if (quote.attachments?.length) {
    embeds = quote.attachments.map((p: string) => ({ image: { url: new URL(p.replace("public/", ""), env.CANONICAL_URL).href } }));
  }

  const pollPayload = {
    duration: 25, // Hours
    layoutType: PollLayoutType.Default,
    question: { text: `Citat Quiz #${quizNumber}` },
    allowMultiselect: false,
    answers: Object.values(users)
      .map(u => u.name ?? "FEL")
      .sort()
      .map(name => ({ text: name })),
  };

  if (!isDryRun)
    await channel.send({
      content: quizContent,
      ...(embeds ? { embeds } : {}),
      poll: pollPayload,
    });
}

async function endPreviousPoll(message: Message) {
  if (!message.poll?.expiresAt) {
    console.info("No previous poll found to reveal answers for");
    return;
  }
  // End previous poll
  if (message.poll.expiresAt > new Date()) {
    await message.poll.end();
    // Poll ending can be really slow
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}