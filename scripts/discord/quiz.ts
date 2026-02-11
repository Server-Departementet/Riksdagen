import "dotenv/config";
import { env } from "node:process";
import { Client as DiscordClient, GatewayIntentBits, Message, MessageType, PollLayoutType, } from "discord.js";
import { PrismaClient } from "../../src/prisma/generated/index.js";
import fs from "node:fs";
import { Quote } from "./types.ts";
import { ggSansWidths } from "./gg-sans-widths.ts";
import { makeMariaDBAdapter } from "../../src/lib/mariadb-adapter.ts";

const {
  DATABASE_URL,
  DISCORD_BOT_TOKEN,
  REGERINGEN_GUILD_ID,
  QUIZ_CHANNEL_ID,
  CANONICAL_URL,
} = env;

if (!DATABASE_URL) throw new Error("DATABASE_URL is not set in environment variables");
if (!DISCORD_BOT_TOKEN) throw new Error("DISCORD_BOT_TOKEN is not set in environment variables");
if (!REGERINGEN_GUILD_ID) throw new Error("REGERINGEN_GUILD_ID is not set in environment variables");
if (!QUIZ_CHANNEL_ID) throw new Error("QUIZ_CHANNEL_ID is not set in environment variables");
if (!CANONICAL_URL) throw new Error("CANONICAL_URL is not set in environment variables");

const isDryRun = process.argv.includes("--dry-run");

const discordClient = new DiscordClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessagePolls],
});
const prisma = new PrismaClient(makeMariaDBAdapter(DATABASE_URL));
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

    let resultContent = fs.readFileSync("scripts/discord/templates/quiz-result.md", "utf-8");
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
  const sentDate = new Date(quote.createdTimestamp);
  const is23may2024 = (
    sentDate.getUTCFullYear() === 2024
    && sentDate.getUTCMonth() === 4
    && sentDate.getUTCDate() === 23
  );
  const formattedDate = is23may2024
    ? "Okänt"
    : sentDate.toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric", });
  const formattedTime = is23may2024
    ? "Okänt"
    : sentDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", });
  const sender = (
    quote.sender.toLowerCase().includes("winroth")
    && is23may2024
  )
    ? "Okänd"
    : quote.sender;

  const lengths: number[] = (new Array(50).fill(8500) as number[]).map((floor, i) => floor + i * 100);
  const paddingCandidates: {
    datePad: ReturnType<typeof computeWidthPadding>;
    timePad: ReturnType<typeof computeWidthPadding>;
    senderPad: ReturnType<typeof computeWidthPadding>;
    contextPad?: ReturnType<typeof computeWidthPadding>;
  }[] = [];
  for (const targetWidth of lengths) {
    const datePad = computeWidthPadding(targetWidth - measureGGSans(formattedDate), "closest");
    const timePad = computeWidthPadding(targetWidth - measureGGSans(formattedTime), "closest");
    const senderPad = computeWidthPadding(targetWidth - measureGGSans(sender), "closest");
    let contextPad: ReturnType<typeof computeWidthPadding> | undefined = undefined;
    if (quote.context) {
      contextPad = computeWidthPadding(targetWidth - measureGGSans(quote.context), "closest");
    }
    paddingCandidates.push({ datePad, senderPad, timePad, contextPad, });
  }

  // Choose candidate with minimal total error
  paddingCandidates.sort((a, b) => {
    const aError = a.datePad.error - a.senderPad.error;
    const bError = b.datePad.error - b.senderPad.error;
    return Math.abs(aError) - Math.abs(bError);
  });
  const bestCandidate = paddingCandidates[0];

  const quizData = {
    "quizNumber": quizNumber,
    "quoteBody": quote.body,
    ...quote.context
      ? { "context": `sammanhang\t|| *${quote.context}* ${bestCandidate.contextPad?.pad}||`, }
      : {},
    "date": `datum\t\t\t\t || *${formattedDate}* ${bestCandidate.datePad.pad}||`,
    "time": `tid\t\t\t\t\t\t || *${formattedTime}* ${bestCandidate.timePad.pad}||`,
    "sender": `skrevs av\t\t\t|| *${sender}* ${bestCandidate.senderPad.pad}||`,
    "quoteId": quote.id,
  };

  let quizContent = fs.readFileSync("scripts/discord/templates/quiz-question.md", "utf-8");
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
    let ended = false;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        await message.poll.end();
        ended = true;
        break;
      }
      catch (error) {
        if (attempt === 9) {
          console.warn("Failed to end poll after 10 seconds", error);
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    if (!ended) return;
  }
}

/** Measure visual width using your ggSansWidths table. */
function measureGGSans(text: string): number {
  let w = 0;
  for (const ch of text) {
    w += ggSansWidths[ch] ?? 500;
  }
  return w;
}

type PadMode = "floor" | "closest" | "ceil";

/**
 * Build a spaces-only padding string whose width is:
 * - "floor": best width <= target (won't overshoot)
 * - "closest": minimal absolute error (may overshoot)
 * - "ceil": best width >= target (won't undershoot)
 */
function computeWidthPadding(
  targetWidth: number,
  mode: PadMode = "floor",
): { pad: string; spaces: number; width: number; error: number } {
  if (targetWidth <= 0) {
    return { pad: "", spaces: 0, width: 0, error: 0 };
  }

  const spaceWidth = ggSansWidths[" "];
  if (!spaceWidth) throw new Error("No width data for space character");
  const floorSpaces = Math.max(0, Math.floor(targetWidth / spaceWidth));
  const ceilSpaces = Math.max(0, Math.ceil(targetWidth / spaceWidth));

  let spaces: number;
  if (mode === "floor") {
    spaces = floorSpaces;
  }
  else if (mode === "ceil") {
    spaces = ceilSpaces;
  }
  else if (mode === "closest") {
    if (floorSpaces === ceilSpaces) {
      spaces = floorSpaces;
    }
    else {
      const floorWidth = floorSpaces * spaceWidth;
      const ceilWidth = ceilSpaces * spaceWidth;
      const floorErr = Math.abs(targetWidth - floorWidth);
      const ceilErr = Math.abs(targetWidth - ceilWidth);
      spaces = ceilErr < floorErr ? ceilSpaces : floorSpaces;
    }
  }
  else {
    throw new Error(`Unknown mode: ${mode as string} (${typeof mode})`);
  }

  const width = spaces * spaceWidth;
  return {
    pad: " ".repeat(spaces),
    spaces,
    width,
    error: targetWidth - width,
  };
}