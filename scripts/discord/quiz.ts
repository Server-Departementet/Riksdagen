import "dotenv/config";
import { env } from "node:process";
import { Client as DiscordClient, GatewayIntentBits, Message, MessageType, PollLayoutType, } from "discord.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../src/prisma/generated/index.js";
import fs from "node:fs";
import { Quote } from "./types.ts";
import { ggSansWidths } from "./gg-sans-widths.ts";

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
  // const dateHintStart = "-# datum *";
  const {
    paddedA: bestDate,
    paddedB: bestSender,
  } = matchStringLengths(
    "-# datum ",
    "-# skrevs av ",
  );

  const sentDate = new Date(quote.createdTimestamp);
  const formattedDate = sentDate.toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric", });
  const sender = (
    quote.sender.toLowerCase().includes("winroth")
    && sentDate.getUTCFullYear() === 2024
    && sentDate.getUTCMonth() === 4
    && sentDate.getUTCDate() === 23
  )
    ? "Okänd"
    : quote.sender;
  const quizData = {
    "quizNumber": quizNumber,
    "quoteBody": quote.body,
    "quoteId": quote.id,
    "date": `${bestDate}|| *${formattedDate}* ||`,
    "sender": `${bestSender}|| *${sender}* ||`,
    ...quote.context ? { "context": `*${quote.context}*`.padEnd(36, " "), } : {},
  };

  // Pad end of hints to obfuscate lengths and use GG Sans character widths
  const maxChars = 40;
  const startChars = Math.max(quizData.date.length, quizData.sender.length) + 2;
  const avgChar = 500;

  const attempts: {
    date: string;
    sender: string;
    diff: number;
  }[] = [];
  for (let chars = startChars; chars <= maxChars; chars++) {
    const targetLength = chars * avgChar;
    const datePadded = padGGSansToLength(quizData.date, targetLength);
    const senderPadded = padGGSansToLength(quizData.sender, targetLength);
    const diff = Math.abs(datePadded.finalLength - senderPadded.finalLength);
    attempts.push({
      date: datePadded.result,
      sender: senderPadded.result,
      diff,
    });
  }

  // // Try the different target lengths to find most aligned option
  // const bestLengthMatch: {
  //   targetLength: number;
  //   date: {
  //     string: string;
  //     length: number;
  //   };
  //   sender: {
  //     string: string;
  //     length: number;
  //   };
  //   context?: {
  //     string: string;
  //     length: number;
  //   };
  // } = targetChars.map((targetChar) => {
  //   const targetLength = targetChar * avgChar;
  //   const datePadded = padGGSansToLength(quizData.date, targetLength);
  //   const senderPadded = padGGSansToLength(quizData.sender, targetLength);
  //   const contextPadded = quizData.context
  //     ? padGGSansToLength(quizData.context, targetLength)
  //     : undefined;
  //   return {
  //     targetLength,
  //     date: {
  //       string: datePadded.result,
  //       length: datePadded.finalLength,
  //     },
  //     sender: {
  //       string: senderPadded.result,
  //       length: senderPadded.finalLength,
  //     },
  //     ...(contextPadded ? {
  //       context: {
  //         string: contextPadded.result,
  //         length: contextPadded.finalLength,
  //       },
  //     } : {}),
  //   };
  // })
  //   .sort((a, b) => {
  //     // Sort by max length difference
  //     const dateDiffA = Math.abs(a.date.length - a.targetLength);
  //     const senderDiffA = Math.abs(a.sender.length - a.targetLength);
  //     const contextDiffA = a.context ? Math.abs(a.context.length - a.targetLength) : 0;
  //     const maxDiffA = Math.max(dateDiffA, senderDiffA, contextDiffA);

  //     const dateDiffB = Math.abs(b.date.length - b.targetLength);
  //     const senderDiffB = Math.abs(b.sender.length - b.targetLength);
  //     const contextDiffB = b.context ? Math.abs(b.context.length - b.targetLength) : 0;
  //     const maxDiffB = Math.max(dateDiffB, senderDiffB, contextDiffB);

  //     return maxDiffA - maxDiffB;
  //   })
  //   .at(0);

  // Apply best attempt paddings
  quizData.date = bestLengthMatch.date.string;
  quizData.sender = bestLengthMatch.sender.string;
  if (quizData.context && bestLengthMatch.context) {
    quizData.context = bestLengthMatch.context.string;
  }

  let quizContent = fs.readFileSync("scripts/discord/quiz-template.md", "utf-8");
  for (const [key, value] of Object.entries(quizData)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    quizContent = quizContent.replace(regex, value.toString());
  }

  // Remove line with {{context}} if no context is provided
  if (!quote.context) {
    quizContent = quizContent
      .split("\n")
      .filter(line => !line.includes("{{context}}"))
      .join("\n");
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

function getGGSansLength(input: string): number {
  let length = 0;
  for (const char of input) {
    length += ggSansWidths[char] ?? 500;
  }
  return length;
}

function padGGSansToLength(input: string, targetLength: number): { result: string; finalLength: number } {
  const currentLength = getGGSansLength(input);
  const remainingLength = targetLength - currentLength;
  const spaceWidth = ggSansWidths[" "];
  const spacesToAdd = Math.floor(remainingLength / spaceWidth);
  return {
    result: input + " ".repeat(spacesToAdd),
    finalLength: currentLength + (spacesToAdd * spaceWidth),
  };
}

function matchStringLengths(
  strA: string,
  strB: string,
  lengthCap: number = 40 * 500,
): { paddedA: string; paddedB: string } {
  let paddedA = strA;
  let paddedB = strB;
  let lengthA = getGGSansLength(paddedA);
  let lengthB = getGGSansLength(paddedB);

  while (lengthA < lengthCap && lengthB < lengthCap && lengthA !== lengthB) {
    if (lengthA < lengthB) {
      paddedA += " ";
      lengthA += ggSansWidths[" "];
    } else if (lengthB < lengthA) {
      paddedB += " ";
      lengthB += ggSansWidths[" "];
    }
  }

  return { paddedA, paddedB };
}