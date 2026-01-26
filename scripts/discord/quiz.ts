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
    .filter(q => q.context)
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

  const lengths = new Array(10).fill(0).map((_, i) => (i + 20) * 500);
  const candidates: {
    datePad: ReturnType<typeof computeWidthPadding>;
    senderPad: ReturnType<typeof computeWidthPadding>;
    contextPad?: ReturnType<typeof computeWidthPadding>;
  }[] = [];
  for (const targetWidth of lengths) {
    const datePad = computeWidthPadding(targetWidth - measureGGSans(formattedDate), "closest");
    const senderPad = computeWidthPadding(targetWidth - measureGGSans(sender), "closest");
    let contextPad: ReturnType<typeof computeWidthPadding> | undefined = undefined;
    if (quote.context) {
      contextPad = computeWidthPadding(targetWidth - measureGGSans(quote.context), "closest");
    }
    candidates.push({ datePad, senderPad, contextPad, });
  }

  // Choose candidate with minimal total error
  candidates.sort((a, b) => {
    const aError = a.datePad.error + a.senderPad.error + (a.contextPad ? a.contextPad.error : 0);
    const bError = b.datePad.error + b.senderPad.error + (b.contextPad ? b.contextPad.error : 0);
    return Math.abs(aError) - Math.abs(bError);
  });
  const bestCandidate = candidates[0];
  const trailingDatePad = bestCandidate.datePad;
  const trailingSenderPad = bestCandidate.senderPad;
  const trailingContextPad = bestCandidate.contextPad;

  const quizData = {
    "quizNumber": quizNumber,
    "quoteBody": quote.body,
    ...quote.context
      ? { "context": `sammanhang\t|| *${quote.context}* ${trailingContextPad?.pad}||`, }
      : {},
    "date": `datum\t\t\t\t || *${formattedDate}* ${trailingDatePad.pad}||`,
    "sender": `skrevs av\t\t\t|| *${sender}* ${trailingSenderPad.pad}||`,
    "quoteId": quote.id,
  };

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
 * Find a tabs+spaces padding string whose width is:
 * - "floor": best width <= target (won't overshoot)
 * - "closest": minimal absolute error (may overshoot)
 * - "ceil": best width >= target (won't undershoot)
 */
function computeWidthPadding(
  targetWidth: number,
  mode: PadMode = "floor",
): { pad: string; tabs: number; spaces: number; width: number; error: number } {
  if (targetWidth <= 0) {
    return { pad: "", tabs: 0, spaces: 0, width: 0, error: 0 };
  }

  // Upper bound for tabs to consider. A small extra margin helps for closest/ceil.
  const maxTabs = Math.ceil(targetWidth / ggSansWidths["\t"]) + 2;

  let best: { tabs: number; spaces: number; width: number; error: number } | null = null;

  for (let tabs = 0; tabs <= maxTabs; tabs++) {
    const wTabs = tabs * ggSansWidths["\t"];
    const remaining = targetWidth - wTabs;

    // Choose spaces count based on mode
    let spaces: number;
    if (mode === "floor") {
      spaces = Math.max(0, Math.floor(remaining / ggSansWidths[" "]));
    }
    else if (mode === "ceil") {
      spaces = Math.max(0, Math.ceil(remaining / ggSansWidths[" "]));
    }
    else if (mode === "closest") {
      const s0 = Math.max(0, Math.floor(remaining / ggSansWidths[" "]));
      const s1 = Math.max(0, Math.ceil(remaining / ggSansWidths[" "]));
      const w0 = wTabs + s0 * ggSansWidths[" "];
      const w1 = wTabs + s1 * ggSansWidths[" "];
      const e0 = Math.abs(targetWidth - w0);
      const e1 = Math.abs(targetWidth - w1);
      spaces = e1 < e0 ? s1 : s0;
    }
    else {
      throw new Error(`Unknown mode: ${mode as string} (${typeof mode})`);
    }

    const width = wTabs + spaces * ggSansWidths[" "];
    const error = targetWidth - width; // Positive means we are short

    // Enforce constraints for floor/ceil
    if (mode === "floor" && width > targetWidth) continue;
    if (mode === "ceil" && width < targetWidth) continue;

    // Scoring:
    // 1) Minimize absolute error (or maximize width for floor / minimize width for ceil)
    // 2) Tie-break: fewer characters (prefer tabs usually)
    // 3) Tie-break: more tabs (often looks cleaner)
    const absErr = Math.abs(targetWidth - width);
    const chars = tabs + spaces;

    if (!best) {
      best = { tabs, spaces, width, error };
      continue;
    }

    const bestAbsErr = Math.abs(targetWidth - best.width);
    const bestChars = best.tabs + best.spaces;

    const better =
      absErr < bestAbsErr
      || (absErr === bestAbsErr && chars < bestChars)
      || (absErr === bestAbsErr && chars === bestChars && tabs > best.tabs);

    if (better) best = { tabs, spaces, width, error };
  }

  // If nothing matched constraints, fall back (should be rare)
  best ??= { tabs: 0, spaces: Math.ceil(targetWidth / ggSansWidths[" "]), width: Math.ceil(targetWidth / ggSansWidths[" "]) * ggSansWidths[" "], error: targetWidth - Math.ceil(targetWidth / ggSansWidths[" "]) * ggSansWidths[" "] };

  return {
    pad: "\t".repeat(best.tabs) + " ".repeat(best.spaces),
    tabs: best.tabs,
    spaces: best.spaces,
    width: best.width,
    error: targetWidth - best.width,
  };
}

/** Pad string to a given visual width. */
function padEndGGSans(
  text: string,
  targetVisualWidth: number,
  mode: PadMode = "floor",
): string {
  const w = measureGGSans(text);
  const needed = targetVisualWidth - w;
  const pad = computeWidthPadding(needed, mode).pad;
  return text + pad;
}