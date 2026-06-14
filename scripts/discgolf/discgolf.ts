import "dotenv/config";
import type { ChatInputCommandInteraction, Message } from "discord.js";
import { Client as DiscordClient, Events, GatewayIntentBits, MessageFlags, REST, Routes, SlashCommandBuilder } from "discord.js";

const COURSE_NAME_MIN_LENGTH = 3;
const COURSE_NAME_MAX_LENGTH = 30;
const SINGLE_HOLE_MAX_SCORE = 30; // Par on Domarringen is 27

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
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Svarar med pong och latens"),
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
    case "ping":
      await ping(interaction);
      return;
    default:
      logWarn("Unknown command", { commandName: interaction.commandName });
      await interaction.reply({ content: "Unknown command.", flags: MessageFlags.Ephemeral });
  }
}

async function ping(interaction: ChatInputCommandInteraction) {
  logInfo("ping command started", { userId: interaction.user.id, interactionId: interaction.id });
  const latency = Math.round(discordClient.ws.ping);
  const roundtrip = Date.now() - interaction.createdTimestamp;
  await interaction.reply({
    content: `Pong! 🏓 WebSocket: ${latency}ms, svarstid: ${roundtrip}ms`,
    flags: MessageFlags.Ephemeral,
  });
  logInfo("ping command finished", { latency, roundtrip, interactionId: interaction.id });
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

  logInfo("Running 'alla' flow (aggregated)", { interactionId: interaction.id });
  const guild = interaction.guild ?? await discordClient.guilds.fetch(DISCGOLF_GUILD_ID);
  await guild.members.fetch();
  const fancyDate = new Date(courseMessage.createdTimestamp).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm", dateStyle: "long" });
  const lines: string[] = [];
  for (const member of guild.members.cache.values()) {
    if (member.user.bot) continue;
    const { points } = getUserScore(member.id, allMessages.toJSON(), courseMessage);
    if (points === 0) continue;
    lines.push(`<@${member.id}> - totalt ${points}`);
  }

  if (lines.length === 0) {
    await interaction.reply({ content: `Inga resultat hittades att skicka för banan ${courseMessage.content}.`, flags: MessageFlags.Ephemeral });
    return;
  }

  const out = `-# ${fancyDate}\n${courseMessage.content}\n${lines.join("\n")}`;
  if (!("send" in writeChannel)) {
    logError("Write channel not text-based during 'alla' run", undefined, { channelId: writeChannel.id, interactionId: interaction.id });
    await interaction.reply({ content: "Write channel is not text-based.", flags: MessageFlags.Ephemeral });
    return;
  }
  const sent = await writeChannel.send(out);
  logInfo("Sent aggregated score message (alla)", { messageId: sent.id, channelId: writeChannel.id, interactionId: interaction.id });
  await interaction.reply({ content: `Skickade ett meddelande med ${lines.length} resultat.`, flags: MessageFlags.Ephemeral });
}

function isCourseMessage(content: string): boolean {
  const trimmed = content.trim();

  const lengthOk = trimmed.length >= COURSE_NAME_MIN_LENGTH
    && trimmed.length <= COURSE_NAME_MAX_LENGTH;
  if (!lengthOk) return false;

  // Only letters, digits and spaces allowed (e.g. "Domarringen Svart Slinga")
  const allowedChars = /^[a-zA-ZåäöÅÄÖ0-9 -_]+$/.test(trimmed);
  if (!allowedChars) return false;

  // Must be mostly text: more letters than digits (rejects pure-number score lines)
  const letterCount = (trimmed.match(/[a-zA-ZåäöÅÄÖ]/g) ?? []).length;
  const digitCount = (trimmed.match(/[0-9]/g) ?? []).length;
  return letterCount > digitCount;
}

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

    const nonNumberRegex = /[^0-9\s]/;
    if (nonNumberRegex.test(message.content)) continue;

    const asNumber = Number(message.content.trim());
    if (!isNaN(asNumber) && asNumber > SINGLE_HOLE_MAX_SCORE) continue;

    const [course, point] = message.content.split(" ").map(s => s.trim());
    if (!course || !point) {
      logWarn("Skipping message (could not split into course and point)", { messageId: message.id, content: message.content });
      continue;
    }

    const parsedPoint = parseInt(point, 10);
    if (isNaN(parsedPoint)) {
      logWarn("Skipping message (point not a number)", { messageId: message.id, pointStr: point });
      continue;
    }

    score[course] = parsedPoint;
    logInfo("Parsed score line", { messageId: message.id, course, parsedPoint });
  }

  const points = Object.values(score).reduce((a, b) => a + b, 0);
  logInfo("Finished calculating user score", { userId, totalPoints: points, entries: score });
  return { points, score };
}