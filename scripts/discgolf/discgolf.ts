import "dotenv/config";
import path from "node:path";
import type { ChatInputCommandInteraction, Message } from "discord.js";
import { Client as DiscordClient, Events, GatewayIntentBits, MessageFlags, REST, Routes, SlashCommandBuilder } from "discord.js";
import type { Course } from "./courses";
import { buildScoreTable, findCourse, formatRelative, loadCourses, relativeToPar } from "./courses";

const COURSE_NAME_MIN_LENGTH = 3;
const COURSE_NAME_MAX_LENGTH = 20;
const SINGLE_HOLE_MAX_SCORE = 20; // Par on Domarringen is 27

// Logger utility
function log(level: "INFO" | "WARN" | "ERROR", message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const extra = data ? ` ${JSON.stringify(data)}` : "";
  console.log(`[${timestamp}] [${level}] ${message}${extra}`);
}

function logInfo(message: string, data?: Record<string, unknown>) {
  log("INFO", message, data);
}

function logWarn(message: string, data?: Record<string, unknown>) {
  log("WARN", message, data);
}

function logError(message: string, error?: unknown, data?: Record<string, unknown>) {
  const errorMsg = error instanceof Error ? error.message : String(error);
  log("ERROR", message, { ...data, error: errorMsg });
}

logInfo("Starting Discord Discgolf Bot");

const courses = loadCourses(path.join(import.meta.dirname, "courses"));
logInfo("Loaded courses", { count: courses.length, names: courses.map((course) => course.name) });

if (!process.env.DISCORD_BOT_TOKEN) throw new Error("DISCORD_BOT_TOKEN is not set in environment variables");
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!process.env.DISCORD_BOT_CLIENT_ID) throw new Error("DISCORD_BOT_CLIENT_ID is not set in environment variables");
const DISCORD_BOT_CLIENT_ID = process.env.DISCORD_BOT_CLIENT_ID;
if (!process.env.DISCGOLF_GUILD_ID) throw new Error("DISCGOLF_GUILD_ID is not set in environment variables");
const DISCGOLF_GUILD_ID = process.env.DISCGOLF_GUILD_ID;
if (!process.env.DISCGOLF_READ_CHANNEL_ID) throw new Error("DISCGOLF_READ_CHANNEL_ID is not set in environment variables");
const DISCGOLF_READ_CHANNEL_ID = process.env.DISCGOLF_READ_CHANNEL_ID;
if (!process.env.DISCGOLF_WRITE_CHANNEL_ID) throw new Error("DISCGOLF_WRITE_CHANNEL_ID is not set in environment variables");
const DISCGOLF_WRITE_CHANNEL_ID = process.env.DISCGOLF_WRITE_CHANNEL_ID;

const discordClient = new DiscordClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});

const commands = [
  new SlashCommandBuilder()
    .setName("räkna")
    .setDescription("Räknar poäng från senaste banan"),
].map((command) => command.toJSON());

async function registerCommands() {
  const rest = new REST().setToken(DISCORD_BOT_TOKEN);
  logInfo("Registering commands", { guildId: DISCGOLF_GUILD_ID, commandCount: commands.length });
  await rest.put(
    Routes.applicationGuildCommands(DISCORD_BOT_CLIENT_ID, DISCGOLF_GUILD_ID),
    { body: commands },
  );
  logInfo("Successfully registered guild application (/) commands");
}

discordClient.once(Events.ClientReady, (client) => {
  logInfo("Discord client is ready", { userId: client.user.id, username: client.user.tag });
  registerCommands()
    .then(() => {
      logInfo("Finished registering commands");
    })
    .catch((err: unknown) => {
      logError("Error registering commands", err);
    });
});

// Handle interactions
discordClient.on(Events.InteractionCreate, (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  logInfo("Chat input command received", {
    commandName: interaction.commandName,
    userId: interaction.user.id,
    username: interaction.user.username,
    interactionId: interaction.id,
    guildId: interaction.guildId,
  });

  dispatchCommands(interaction)
    .catch((err: unknown) => {
      logError("Error handling command", err, {
        commandName: interaction.commandName,
        userId: interaction.user.id,
        interactionId: interaction.id,
      });
      if (interaction.replied || interaction.deferred) {
        interaction.followUp({ content: "There was an error while executing this command!", flags: MessageFlags.Ephemeral }).catch(console.error);
      } else {
        interaction.reply({ content: "There was an error while executing this command!", flags: MessageFlags.Ephemeral }).catch(console.error);
      }
    });
});

async function dispatchCommands(interaction: ChatInputCommandInteraction) {
  switch (interaction.commandName) {
    case "räkna":
      await räkna(interaction);
      return;
    default:
      logWarn("Unknown command", { commandName: interaction.commandName });
      await interaction.reply({ content: "Unknown command.", flags: MessageFlags.Ephemeral });
  }
}

await discordClient.login(DISCORD_BOT_TOKEN);
logInfo("Bot logged in and listening for interactions");

async function räkna(interaction: ChatInputCommandInteraction) {
  const sender = interaction.member?.user;
  logInfo("räkna command started", { userId: sender?.id, username: sender?.username, interactionId: interaction.id });

  if (!sender) {
    logError("Could not determine sender", undefined, { interactionId: interaction.id });
    await interaction.reply({ content: "Could not determine sender.", flags: MessageFlags.Ephemeral });
    return;
  }

  const readChannel = await discordClient.channels.fetch(DISCGOLF_READ_CHANNEL_ID);
  if (!readChannel?.isTextBased()) {
    logError("Read channel not found or is not text-based", undefined, { channelId: DISCGOLF_READ_CHANNEL_ID, interactionId: interaction.id });
    await interaction.reply({ content: "Read channel not found or is not text-based.", flags: MessageFlags.Ephemeral });
    return;
  }
  const writeChannel = await discordClient.channels.fetch(DISCGOLF_WRITE_CHANNEL_ID);
  if (!writeChannel?.isTextBased()) {
    logError("Write channel not found or is not text-based", undefined, { channelId: DISCGOLF_WRITE_CHANNEL_ID, interactionId: interaction.id });
    await interaction.reply({ content: "Write channel not found or is not text-based.", flags: MessageFlags.Ephemeral });
    return;
  }

  logInfo("Fetching messages", { userId: sender.id, readChannelId: readChannel.id, limit: 100, interactionId: interaction.id });
  const allMessages = (await readChannel.messages.fetch({ limit: 100 })).filter(m => !m.author.bot);
  logInfo("Messages fetched", { count: allMessages.size, interactionId: interaction.id });

  const courseMessage = allMessages.filter(m =>
    isCourseMessage(m.content),
  ).first();

  if (!courseMessage) {
    logWarn("No course message found", { userId: sender.id, interactionId: interaction.id });
    await interaction.reply({ content: `Hittade ingen bana i dem senaste 100 meddelandena.`, flags: MessageFlags.Ephemeral });
    return;
  }

  logInfo("Course message found", {
    messageId: courseMessage.id,
    content: courseMessage.content,
    timestamp: courseMessage.createdTimestamp,
    interactionId: interaction.id,
  });

  const course = findCourse(courses, courseMessage.content);
  if (!course) {
    logWarn("No course file matches course message, pars will be unavailable", { course: courseMessage.content, interactionId: interaction.id });
  }

  const guild = interaction.guild ?? await discordClient.guilds.fetch(DISCGOLF_GUILD_ID);
  await guild.members.fetch();
  const fancyDate = new Date(courseMessage.createdTimestamp).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm", dateStyle: "long" });
  const results: { memberId: string; points: number; score: Record<string, number> }[] = [];
  for (const member of guild.members.cache.values()) {
    if (member.user.bot) continue;
    const { points, score } = getUserScore(member.id, allMessages.toJSON(), courseMessage);
    if (points === 0) continue;
    results.push({ memberId: member.id, points, score });
  }

  if (results.length === 0) {
    await interaction.reply({ content: `Inga resultat hittades att skicka för banan ${courseMessage.content}.`, flags: MessageFlags.Ephemeral });
    return;
  }

  results.sort((a, b) => a.points - b.points);
  const lines = results.map(({ memberId, points, score }) =>
    `<@${memberId}> - totalt ${points}${formatRelativeSuffix(course, score)}`,
  );
  const table = buildScoreTable(course, results.map((result) => result.score));
  const out = `-# ${fancyDate}\n${courseMessage.content}\n${lines.join("\n")}\n\`\`\`\n${table}\n\`\`\``;
  if (!("send" in writeChannel)) {
    logError("Write channel is not text-based", undefined, { channelId: writeChannel.id, interactionId: interaction.id });
    await interaction.reply({ content: "Write channel is not text-based.", flags: MessageFlags.Ephemeral });
    return;
  }
  const sent = await writeChannel.send(out);
  logInfo("Sent aggregated score message", { messageId: sent.id, channelId: writeChannel.id, interactionId: interaction.id });
  await interaction.reply({ content: `Skickade ett meddelande med ${lines.length} resultat.`, flags: MessageFlags.Ephemeral });
}

function isCourseMessage(content: string): boolean {
  if (findCourse(courses, content)) return true;
  const isOnlyString = /^[a-zA-ZåäöÅÄÖ]+$/.test(content);
  const lengthOk = content.length >= COURSE_NAME_MIN_LENGTH
    && content.length <= COURSE_NAME_MAX_LENGTH;
  return isOnlyString && lengthOk;
}

// "<hole id> <score>" where the hole id is a number optionally prefixed by letters, e.g. "5 11" or "X1 3"
const scoreLineRegex = /^([a-zA-ZåäöÅÄÖ]*\d+)\s+(\d+)$/;

function getUserScore(userId: string, messages: Message[], courseMessage: Message): {
  points: number;
  score: Record<string, number>;
} {
  const score: Record<string, number> = {};
  logInfo("Calculating score for user", { userId, courseMessageId: courseMessage.id, course: courseMessage.content });
  for (const message of messages) {
    if (message.author.id !== userId) continue;
    if (message.createdTimestamp <= courseMessage.createdTimestamp) continue;
    if (isCourseMessage(message.content)) continue;

    for (const line of message.content.split("\n")) {
      const match = scoreLineRegex.exec(line.trim());
      const [, hole, pointString] = match ?? [];
      if (!hole || !pointString) continue;

      const parsedPoint = parseInt(pointString, 10);
      if (parsedPoint > SINGLE_HOLE_MAX_SCORE) {
        logWarn("Skipping score line (score above max)", { messageId: message.id, hole, parsedPoint });
        continue;
      }

      score[hole] = parsedPoint;
      logInfo("Parsed score line", { messageId: message.id, hole, parsedPoint });
    }
  }

  const points = Object.values(score).reduce((a, b) => a + b, 0);
  logInfo("Finished calculating user score", { userId, totalPoints: points, entries: score });
  return { points, score };
}

function formatRelativeSuffix(course: Course | undefined, score: Record<string, number>): string {
  if (!course) return "";
  return ` (${formatRelative(relativeToPar(course, score))})`;
}