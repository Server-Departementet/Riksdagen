import "dotenv/config";
import { env } from "node:process";
import { Channel, Client as DiscordClient, GatewayIntentBits, Message, MessageType, PollLayoutType, } from "discord.js";
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
let pollCleanupPromise: Promise<void> | null = null;

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
    if (pollCleanupPromise) {
      await pollCleanupPromise;
    }
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
    pollCleanupPromise = endPreviousPoll(lastQuiz, channel);

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
    await channel.send(resultContent);
    quizNumber += 1;


    // If it's the last day of the month, also post a scoreboard
    const isSaturday = new Date().getUTCDay() === 6;
    if (isSaturday) {
      const scores: Record<string, number> = {};
      const quizResultRegex = /## citat quiz #(\d+) resultat/i;
      const extractQuizNumber = (content: string): number | null => {
        const match = quizResultRegex.exec(content);
        return match ? Number(match[1]) : null;
      };

      // Look for previous scoreboard messages to seed scores, then add newer results.
      const scoreboardMessages = latestMessages
        .filter((msg) =>
          msg.author.id === discordClient.user?.id
          && msg.type === MessageType.Default
          && msg.content.toLowerCase().startsWith("# citat quiz scoreboard #0-")
        );

      let lastScoreboardQuizNumber: number | null = null;

      if (scoreboardMessages.size) {
        console.info(`Found ${scoreboardMessages.size} previous scoreboard messages, using the latest one to compile scores`);

        const latestScoreboard = scoreboardMessages.first();
        if (!latestScoreboard) {
          throw new Error("Unexpected error fetching last scoreboard message");
        }
        const scoreboardTitleMatch = /# citat quiz scoreboard #0-(\d+)/i.exec(latestScoreboard.content);
        if (scoreboardTitleMatch) {
          lastScoreboardQuizNumber = Number(scoreboardTitleMatch[1]);
        }
        const statsRegex = /-# \[(\d+) \/ (\d+)\] (\d+)% - (.*)/;
        for (const line of latestScoreboard.content.split("\n")) {
          const match = statsRegex.exec(line);
          if (!match) continue;

          const userName = match[4];
          const score = Number(match[1]);
          const user = Object.values(users).find(u => u.name === userName);
          if (!user) {
            console.warn(`Could not find user with name ${userName} from previous scoreboard, skipping`);
            continue;
          }
          scores[user.id] = score;
        }
      }

      const quizResultMessages = new Map<string, Message>();
      const collectQuizResults = (messages: typeof latestMessages) => {
        messages.forEach(msg => {
          if (
            msg.author.id === discordClient.user?.id
            && msg.type === MessageType.Default
            && msg.content.toLowerCase().startsWith("## citat quiz #")
            && msg.content.split("\n")[0].toLowerCase().endsWith(" resultat")
          ) {
            quizResultMessages.set(msg.id, msg);
          }
        });
      };

      collectQuizResults(latestMessages);

      const hasReachedScoreboard = () => {
        const quizNumbers = [...quizResultMessages.values()]
          .map(msg => extractQuizNumber(msg.content))
          .filter((n): n is number => n !== null);
        if (!quizNumbers.length) return false;
        if (lastScoreboardQuizNumber === null) {
          return quizNumbers.includes(0);
        }
        return quizNumbers.some(n => n <= lastScoreboardQuizNumber);
      };

      let beforeId = latestMessages.last()?.id;
      const maxPages = 20;
      let pages = 0;
      while (!hasReachedScoreboard() && beforeId && pages < maxPages) {
        if (pages >= maxPages) {
          console.warn("Reached maximum number of pages while fetching quiz results, stopping to avoid infinite loop");
          break;
        }
        const moreMessages = await channel.messages.fetch({ limit: 100, before: beforeId, });
        if (!moreMessages.size) break;
        collectQuizResults(moreMessages);
        beforeId = moreMessages.last()?.id;
        pages += 1;
      }

      const winnerRegex = /<@(\d+)>/g;
      const countedQuizNumbers = new Set<number>();
      const addScoresFromContent = (content: string) => {
        const quizNum = extractQuizNumber(content);
        if (quizNum === null) return;
        if (lastScoreboardQuizNumber !== null && quizNum <= lastScoreboardQuizNumber) return;
        if (countedQuizNumbers.has(quizNum)) {
          console.warn(`Duplicate quiz result detected for quiz #${quizNum}, skipping to avoid double counting`);
          return;
        }
        countedQuizNumbers.add(quizNum);
        for (const match of content.matchAll(winnerRegex)) {
          const userId = match[1];
          if (!users[userId]) {
            console.warn(`Could not find user with ID ${userId} from quiz result message, skipping`);
            continue;
          }
          scores[userId] ??= 0;
          scores[userId] += 1;
        }
      };

      quizResultMessages.forEach(msg => addScoresFromContent(msg.content));
      addScoresFromContent(resultContent);

      let scoreboardContent = fs.readFileSync("scripts/discord/templates/quiz-scoreboard.md", "utf-8");
      const scoreboardData = {
        "latestFinishedQuizNumber": quizNumber - 1,
        "scoreboard": Object.values(users)
          .sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
          .map(u => `-# [${scores[u.id] ?? 0} / ${quizNumber}] ${(((scores[u.id] ?? 0) / quizNumber) * 100).toFixed(0)}% - ${u.name}`) // quizNumber is zero-indexed so this should be the count
          .join("\n"),
      };
      for (const [key, value] of Object.entries(scoreboardData)) {
        const regex = new RegExp(`{{${key}}}`, "g");
        scoreboardContent = scoreboardContent.replace(regex, value.toString());
      }

      if (!isDryRun) {
        await channel.send(scoreboardContent);
      }
    }
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
  const isMigratedQuote = (
    sentDate.getUTCFullYear() === 2024
    && sentDate.getUTCMonth() === 4
    && sentDate.getUTCDate() === 23
    && quote.sender.toLowerCase().includes("winroth")
  );
  const formattedDate = sentDate.toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric", });
  const formattedTime = sentDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", });

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
    const senderPad = computeWidthPadding(targetWidth - measureGGSans(quote.sender), "closest");
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
    ...!isMigratedQuote
      ? {
        "date": `datum\t\t\t\t || *${formattedDate}* ${bestCandidate.datePad.pad}||`,
        "time": `tid\t\t\t\t\t\t || *${formattedTime}* ${bestCandidate.timePad.pad}||`,
        "sender": `skrevs av\t\t\t|| *${quote.sender}* ${bestCandidate.senderPad.pad}||`,
      }
      : {},
    "quoteId": quote.id,
  };

  let quizContent = fs.readFileSync("scripts/discord/templates/quiz-question.md", "utf-8");
  for (const [key, value] of Object.entries(quizData)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    quizContent = quizContent.replace(regex, value.toString());
  }

  // Remove lines with unknown placeholders
  if (!quote.context || isMigratedQuote) {
    quizContent = quizContent
      .split("\n")
      .filter(line =>
        (!line.includes("{{context}}") || quote.context?.length)
        && (!line.includes("{{date}}") || !isMigratedQuote)
        && (!line.includes("{{time}}") || !isMigratedQuote)
        && (!line.includes("{{sender}}") || !isMigratedQuote)
      )
      .join("\n");
  }

  // If no hints (date, time, sender) persist, remove the "Ledtrådar" header as well
  if (!quote.context && isMigratedQuote) {
    quizContent = quizContent
      .replace(/.*Ledtrådar.*(?:\n\r?){2}/, "");
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

function endPreviousPoll(pollMessage: Message, channel: Channel): Promise<void> {
  return (async () => {
    try {
      if (!pollMessage.poll?.expiresAt) {
        console.info("No previous poll found to reveal answers for");
        return;
      }

      if (!channel.isTextBased()) {
        throw new Error("Quiz channel is not a text-based channel");
      }

      // End previous poll
      await pollMessage.poll.end();

      // Delete poll results message because it's ugly and not helpful in a quiz with correct answers
      const timeoutMs = 30_000;
      const intervalMs = 2_000;
      const maxAttempts = Math.ceil(timeoutMs / intervalMs);
      const deadline = Date.now() + timeoutMs;
      let timedOut = false;
      try {
        for (let i = 0; i < maxAttempts; i++) {
          if (Date.now() >= deadline) {
            timedOut = true;
            break;
          }
          const pollResultMessages = (await channel.messages.fetch({ limit: 20, }))
            .filter(msg =>
              msg.author.id === discordClient.user?.id
              && msg.type === MessageType.PollResult
            );
          const foundCount = pollResultMessages.size;
          await Promise.all(pollResultMessages.map(msg => msg.delete()));
          if (foundCount) {
            console.info(`Deleted ${foundCount} poll result ${foundCount === 1 ? "message" : "messages"}`);
            break;
          }
          const remainingMs = deadline - Date.now();
          if (remainingMs <= 0) {
            timedOut = true;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, Math.min(intervalMs, remainingMs)));
        }
      }
      catch (error) {
        console.error("Failed to delete poll result messages:", error);
      }
      if (timedOut) {
        console.warn("Poll result deleter timed out after 60 seconds");
      }
    }
    catch (error) {
      console.error("Failed to end previous poll:", error);
    }
  })();
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