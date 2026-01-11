import "dotenv/config";
import { env } from "node:process";
import { Client as DiscordClient, GatewayIntentBits, MessageType, PollData, PollLayoutType, } from "discord.js";
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
  throw new Error("QUOTE_CHANNEL_ID is not set in environment variables");
}

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

  const quotes = (JSON.parse(fs.readFileSync("scripts/discord/quotes.json", "utf-8")) as Quote[])
    .filter(q => q.quoteeId);

  // Determine the next quiz number based off of the last quiz message
  let quizNumber = 0;
  const latestMessages = await channel.messages.fetch({ limit: 100, });
  const lastQuizMessage = latestMessages
    .find((msg) =>
      msg.author.id === discordClient.user?.id
      && msg.type === MessageType.Default
      && msg.content.startsWith("## Citat quiz")
    );
  if (lastQuizMessage) {
    // Get the quiz number
    const match = /## Citat quiz #(\d+)/.exec(lastQuizMessage.content);
    if (match) quizNumber = Number(match[1]);

    const previousQuoteId = /id: (\d+)/.exec(lastQuizMessage.content)?.[1];
    const previousQuote = quotes.find(q => q.id === previousQuoteId);
    if (!previousQuote) {
      console.info("No previous quote found to reveal answers for");
      return;
    }

    // Reveal the answer to the last quiz
    const lastPoll = latestMessages.find((msg) =>
      msg.author.id === discordClient.user?.id
      && msg.poll
    );

    if (!lastPoll?.poll) {
      console.info("No previous poll found to reveal answers for");
      return;
    }

    // End previous poll
    await lastPoll.poll.end();

    // Poll ending is really slow
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete poll results message cause it's ugly and not helpful in a quiz with correct answers
    const pollResultsMessage = (await channel.messages.fetch({ limit: 10, }))
      .find(msg =>
        msg.author.id === discordClient.user?.id
        && msg.type === MessageType.PollResult
      );
    if (pollResultsMessage) {
      await pollResultsMessage.delete();
    }

    const answers = lastPoll.poll.answers;
    const correctString = Object.values(users).find(u => u.id === previousQuote.quoteeId)?.name;
    const correctAnswer = answers.find(answer => answer.text === correctString);
    const correctVotes = await correctAnswer?.voters.fetch();
    const winningUsers = correctVotes ? Array.from(correctVotes.values()) : [];

    let resultContent = fs.readFileSync("scripts/discord/quiz-result-template.md", "utf-8");
    const lastQuizData = {
      "quizNumber": quizNumber,
      "quotee": previousQuote.quotee,
      "quoteBody": previousQuote.body,
      "link": previousQuote.link,
      "winners": winningUsers.map(u => `<@${u.id}>`).join(" "),
    };
    for (const [key, value] of Object.entries(lastQuizData)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      resultContent = resultContent.replace(regex, value.toString());
    }

    await channel.send(resultContent);
    quizNumber += 1;
  }

  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  /*
   * Make new quiz
   */
  const quizData = {
    "quizNumber": quizNumber,
    "quoteBody": quote.body,
    "sender": quote.sender,
    "date": new Date(quote.createdTimestamp).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    "quoteId": quote.id,
  };

  let quizContent = fs.readFileSync("scripts/discord/quiz-template.md", "utf-8");
  for (const [key, value] of Object.entries(quizData)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    quizContent = quizContent.replace(regex, value.toString());
  }

  // await channel.send(quizContent);
  await channel.send({
    ...quote.attachments?.length
      ? { files: quote.attachments, }
      : {},
    content: quizContent,
  });
  const poll: PollData = {
    duration: 25, // Hours
    layoutType: PollLayoutType.Default,
    question: { text: `Citat Quiz #${quizNumber}`, },
    allowMultiselect: false,
    answers: Object.values(users)
      .map(u => u.name)
      .sort()
      .map(name => ({
        text: name ?? "FEL",
      })),
  }
  await channel.send({
    poll: poll,
  });
}