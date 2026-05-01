import "dotenv/config";
import type { ChatInputCommandInteraction } from "discord.js";
import { Client as DiscordClient, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js";

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
    .setDescription("Räknar din poäng från senaste banan"),
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
        interaction.followUp({ content: "There was an error while executing this command!", ephemeral: true }).catch(console.error);
      } else {
        interaction.reply({ content: "There was an error while executing this command!", ephemeral: true }).catch(console.error);
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
      await interaction.reply({ content: "Unknown command.", ephemeral: true });
  }
}

await discordClient.login(DISCORD_BOT_TOKEN);
logInfo("Bot logged in and listening for interactions");

async function räkna(interaction: ChatInputCommandInteraction) {
  const sender = interaction.member?.user;
  logInfo("räkna command started", { userId: sender?.id, username: sender?.username, interactionId: interaction.id });

  if (!sender) {
    logError("Could not determine sender", undefined, { interactionId: interaction.id });
    await interaction.reply({ content: "Could not determine sender.", ephemeral: true });
    return;
  }

  const readChannel = await discordClient.channels.fetch(DISCGOLF_READ_CHANNEL_ID);
  if (!readChannel?.isTextBased()) {
    logError("Read channel not found or is not text-based", undefined, { channelId: DISCGOLF_READ_CHANNEL_ID, interactionId: interaction.id });
    await interaction.reply({ content: "Read channel not found or is not text-based.", ephemeral: true });
    return;
  }
  const writeChannel = await discordClient.channels.fetch(DISCGOLF_WRITE_CHANNEL_ID);
  if (!writeChannel?.isTextBased()) {
    logError("Write channel not found or is not text-based", undefined, { channelId: DISCGOLF_WRITE_CHANNEL_ID, interactionId: interaction.id });
    await interaction.reply({ content: "Write channel not found or is not text-based.", ephemeral: true });
    return;
  }

  logInfo("Fetching messages", { userId: sender.id, readChannelId: readChannel.id, limit: 100, interactionId: interaction.id });
  const allMessages = (await readChannel.messages.fetch({ limit: 100 }));
  logInfo("Messages fetched", { count: allMessages.size, interactionId: interaction.id });

  const courseMessage = allMessages.filter(m =>
    isCourseMessage(m.content),
  ).first();

  if (!courseMessage) {
    logWarn("No course message found", { userId: sender.id, interactionId: interaction.id });
    await interaction.reply({ content: "No course message found from you in the last 100 messages.", ephemeral: true });
    return;
  }

  logInfo("Course message found", {
    messageId: courseMessage.id,
    content: courseMessage.content,
    timestamp: courseMessage.createdTimestamp,
    interactionId: interaction.id,
  });

  const yourMessages = allMessages.filter(m =>
    m.author.id === sender.id
    && m.createdTimestamp > courseMessage.createdTimestamp,
  );

  logInfo("Filtered user messages after course", { count: yourMessages.size, interactionId: interaction.id });

  const parsedCourseMessage = `Senaste banan tolkas som ${courseMessage.content} (${new Date(courseMessage.createdTimestamp).toISOString()}) (du har skickat ${yourMessages.size} meddelande sen dess)`;
  logInfo("Parsed course message", { parsedCourseMessage, interactionId: interaction.id });
  await interaction.reply({ content: parsedCourseMessage, ephemeral: true });

  const score: Record<string, number> = {};
  for (const message of yourMessages.values()) {
    if (isCourseMessage(message.content)) {
      logWarn("Unexpected course message found in score messages", {
        messageId: message.id,
        content: message.content,
        interactionId: interaction.id,
      });
      interaction.followUp({ content: `Något gick fel i att tolka poängen, hittade oväntat ett till banmeddelande: "${message.content}" (${new Date(message.createdTimestamp).toISOString()})`, ephemeral: true }).catch(console.error);
      throw new Error("Unexpected course message found in score messages");
    }

    // Contains any non-numbers?
    const nonNumberRegex = /[^0-9\s]/;
    if (nonNumberRegex.test(message.content)) {
      logInfo("Skipping message with non-numbers", { messageId: message.id, content: message.content, interactionId: interaction.id });
      continue;
    }

    // If only numbers, if last one is a number and is larger than 20, then probably not a score message
    const asNumber = Number(message.content.trim());
    if (!isNaN(asNumber) && asNumber > 20) {
      logInfo("Skipping message with large number (probably not score)", { messageId: message.id, value: asNumber, interactionId: interaction.id });
      continue;
    }

    const [course, point] = message.content.split(" ").map(s => s.trim());

    if (!course || !point) {
      logWarn("Could not parse course or point from message", {
        messageId: message.id,
        content: message.content,
        interactionId: interaction.id,
      });
      interaction.followUp({ content: `Kunde inte tolka poängen i ditt meddelande: "${message.content}" (${new Date(message.createdTimestamp).toISOString()})`, ephemeral: true }).catch(console.error);
      continue;
    }

    const parsedPoint = parseInt(point, 10);
    if (isNaN(parsedPoint)) {
      logWarn("Could not parse point as number", {
        messageId: message.id,
        content: message.content,
        pointString: point,
        interactionId: interaction.id,
      });
      interaction.followUp({ content: `Kunde inte tolka poängen i ditt meddelande: "${message.content}" (${new Date(message.createdTimestamp).toISOString()})`, ephemeral: true }).catch(console.error);
      continue;
    }

    logInfo("Score parsed successfully", { messageId: message.id, course, point: parsedPoint, interactionId: interaction.id });
    score[course] = parsedPoint;
  }

  const fancyDate = new Date(courseMessage.createdTimestamp).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm", dateStyle: "long" });
  const totalPoints = Object.values(score).reduce((a, b) => a + b, 0);
  const scoreMessage = `-# ${fancyDate}\n${courseMessage.content} - <@${sender.id}> totalt: ${totalPoints}`;

  logInfo("Sending score to write channel", {
    writeChannelId: writeChannel.id,
    userId: sender.id,
    totalPoints,
    interactionId: interaction.id,
  });
  if (!("send" in writeChannel)) {
    logError("Write channel is not text-based", undefined, { channelId: writeChannel.id, interactionId: interaction.id });
    await interaction.followUp({ content: "Write channel is not text-based.", ephemeral: true });
    return;
  }
  const sentMessage = await writeChannel.send(scoreMessage);
  logInfo("Score message sent successfully", {
    messageId: sentMessage.id,
    channelId: writeChannel.id,
    interactionId: interaction.id,
  });
}

function isCourseMessage(content: string): boolean {
  const isOnlyString = /^[a-zA-ZåäöÅÄÖ]+$/.test(content);
  const lengthOk = content.length > 3 && content.length <= 20;
  return isOnlyString && lengthOk;
}