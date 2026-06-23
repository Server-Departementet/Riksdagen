import "dotenv/config";
import fs from "node:fs";
import type { Channel, FetchMessagesOptions, Message } from "discord.js";
import { Client as DiscordClient, GatewayIntentBits } from "discord.js";
import { PrismaClient } from "@/lib/prisma/generated";
import { makeMariaDBAdapter } from "../../src/lib/prisma/mariadb-adapter";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set in environment variables");
const DATABASE_URL = process.env.DATABASE_URL;
if (!process.env.DISCORD_BOT_TOKEN) throw new Error("DISCORD_BOT_TOKEN is not set in environment variables");
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!process.env.REGERINGEN_GUILD_ID) throw new Error("REGERINGEN_GUILD_ID is not set in environment variables");
const REGERINGEN_GUILD_ID = process.env.REGERINGEN_GUILD_ID;
if (!process.env.QUIZ_CHANNEL_ID) throw new Error("QUIZ_CHANNEL_ID is not set in environment variables");
const QUIZ_CHANNEL_ID = process.env.QUIZ_CHANNEL_ID;

const firstQuizMessageId = "1459955029149749349";
const messageDumpFolder = "scripts/quiz/cache";
const messageDumpPath = `${messageDumpFolder}/quiz-channel-messages.json`;

if (!fs.existsSync(messageDumpFolder)) {
  fs.mkdirSync(messageDumpFolder, { recursive: true });
}

const discordClient = new DiscordClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessagePolls],
});
const prisma = new PrismaClient(makeMariaDBAdapter(DATABASE_URL));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const users = Object.fromEntries((
  await prisma.user.findMany()
).map((u) => [u.id, u]));


main()
  .then(() => {
    console.info("Script finished successfully");
    process.exitCode = 0;
  })
  .catch((err: unknown) => {
    console.error("Script failed with error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await discordClient.destroy();
    await prisma.$disconnect();
  });

async function main() {
  await discordClient.login(DISCORD_BOT_TOKEN);

  const guild = await discordClient.guilds.fetch(REGERINGEN_GUILD_ID);
  if (!guild) {
    throw new Error("Could not fetch guild");
  }
  const quizChannel = await guild.channels.fetch(QUIZ_CHANNEL_ID);
  if (!quizChannel) {
    throw new Error("Could not fetch quiz channel");
  }
  if (!quizChannel?.isTextBased()) {
    throw new Error("Quiz channel is not a text-based channel");
  }

  console.info(`Fetching messages from quiz channel ${quizChannel.name} (${quizChannel.id})...`);

  const allQuizMessages = await fetchAllQuizMessages(quizChannel);
  console.info(`Total messages fetched: ${allQuizMessages.length}`);

  const pollRes = allQuizMessages
    .filter(m => m.poll);

  console.log({ pollRes });
}

async function fetchAllQuizMessages(channel: Channel): Promise<Message[]> {
  if (!channel.isTextBased()) {
    throw new Error("Channel is not text-based");
  }

  if (fs.existsSync(messageDumpPath)) {
    const cachePayload = JSON.parse(fs.readFileSync(messageDumpPath, "utf-8")) as { timestamp: number, messages: Message[] };
    const cacheAge = Date.now() - cachePayload.timestamp;
    const maxCacheAge = 1000 * 60 * 60 * 24; // 24 hours
    if (cacheAge < maxCacheAge) {
      console.info(`Using cached messages from ${new Date(cachePayload.timestamp).toISOString()} (${Math.round(cacheAge / 1000)} seconds old)`);
      return cachePayload.messages;
    } else {
      console.info(`Cache is too old (${Math.round(cacheAge / 1000)} seconds), fetching new messages`);
    }
  }

  const messages: Message[] = [];
  let lastId: string | undefined = undefined;
  for (let i = 0; i < 1000; i++) { // 1000 with 50 per page, so should be enough for 50k messages, which is more than we have
    console.log(`Fetching messages batch ${i + 1}...`);

    const options: FetchMessagesOptions = lastId ? { before: lastId, limit: 50 } : { limit: 50 };
    const fetchedMessages = await channel.messages.fetch(options);
    if (fetchedMessages.size === 0) {
      break;
    }
    messages.push(...fetchedMessages.values());
    lastId = fetchedMessages.last()?.id;

    const newIds = fetchedMessages.map(m => m.id);
    if (newIds.includes(firstQuizMessageId)) {
      console.info(`Reached first quiz message with ID ${firstQuizMessageId}, stopping fetch`);
      break;
    }
  }
  console.info(`Fetched ${messages.length} messages from quiz channel`);

  console.info(`Saving fetched messages to cache at ${messageDumpPath}...`);
  fs.writeFileSync(messageDumpPath, JSON.stringify({ timestamp: Date.now(), messages }), "utf-8");
  console.info(`Messages saved to cache`);

  return JSON.parse(JSON.stringify(messages)) as Message[]; // Convert to align it to what the cached version would look like
}