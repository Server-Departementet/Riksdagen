import "dotenv/config";
import type { ChatInputCommandInteraction, MessageComponentInteraction } from "discord.js";
import { Client as DiscordClient, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js";

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
  await rest.put(
    Routes.applicationGuildCommands(DISCORD_BOT_CLIENT_ID, DISCGOLF_GUILD_ID),
    { body: commands },
  );
  console.log("Successfully registered guild application (/) commands.");
}

discordClient.once(Events.ClientReady, (client) => {
  console.log(`Discord client is ready. Logged in as ${client.user.tag}`);
  registerCommands()
    .then(() => {
      console.log("Finished registering commands.");
    })
    .catch((err: unknown) => {
      console.error("Error registering commands:", err);
    });
});

// Handle interactions
discordClient.on(Events.InteractionCreate, (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  directCommand(interaction)
    .catch((err: unknown) => {
      console.error("Error handling command:", err);
      if (interaction.replied || interaction.deferred) {
        interaction.followUp({ content: "There was an error while executing this command!", ephemeral: true }).catch(console.error);
      } else {
        interaction.reply({ content: "There was an error while executing this command!", ephemeral: true }).catch(console.error);
      }
    });
});

async function directCommand(interaction: ChatInputCommandInteraction) {
  switch (interaction.commandName) {
    case "ping":
      await interaction.reply("Pong!");
      return;
    case "räkna":
      await räkna(interaction);
      return;
    default:
      await interaction.reply({ content: "Unknown command.", ephemeral: true });
  }
}

await discordClient.login(DISCORD_BOT_TOKEN);

async function räkna(interaction: ChatInputCommandInteraction) {
  const sender = interaction.member?.user;
  if (!sender) {
    await interaction.reply({ content: "Could not determine sender.", ephemeral: true });
    return;
  }

  const readChannel = await discordClient.channels.fetch(DISCGOLF_READ_CHANNEL_ID);
  if (!readChannel?.isTextBased()) {
    await interaction.reply({ content: "Read channel not found or is not text-based.", ephemeral: true });
    return;
  }
  const writeChannel = await discordClient.channels.fetch(DISCGOLF_WRITE_CHANNEL_ID);
  if (!writeChannel?.isTextBased()) {
    await interaction.reply({ content: "Write channel not found or is not text-based.", ephemeral: true });
    return;
  }

  const allMessages = (await readChannel.messages.fetch({ limit: 100 }));
  const courseMessage = allMessages.filter(m =>
    m.author.id === sender.id
    && isCourseMessage(m.content),
  ).first();
  if (!courseMessage) {
    await interaction.reply({ content: "No course message found from you in the last 100 messages.", ephemeral: true });
    return;
  }
  const yourMessages = allMessages.filter(
    m => m.author.id === sender.id
      && m.createdTimestamp > courseMessage.createdTimestamp,
  );

  const parsedCourseMessage = `Senaste banan tolkas som ${courseMessage.content} (${new Date(courseMessage.createdTimestamp).toISOString()}) (du har skickat ${yourMessages.size} meddelande sen dess)`;
  await interaction.reply({ content: parsedCourseMessage, ephemeral: true });

  const score: Record<string, number> = {};
  for (const message of yourMessages.values()) {
    if (isCourseMessage(message.content)) {
      interaction.followUp({ content: `Något gick fel i att tolka poängen, hittade oväntat ett till banmeddelande: "${message.content}" (${new Date(message.createdTimestamp).toISOString()})`, ephemeral: true }).catch(console.error);
      continue;
    }

    // Contains any non-numbers?
    // E.g.
    // - Tot NN
    // - NN poäng
    // - totalt NN
    const nonNumberRegex = /[^0-9\s]/;
    if (nonNumberRegex.test(message.content)) {
      continue;
    }

    // If only numbers, if last one is a number and is larger than 20, then probably not a score message
    const asNumber = Number(message.content.trim());
    if (!isNaN(asNumber) && asNumber > 20) {
      continue;
    }

    const [course, point] = message.content.split(" ").map(s => s.trim());

    if (!course || !point) {
      interaction.followUp({ content: `Kunde inte tolka poängen i ditt meddelande: "${message.content}" (${new Date(message.createdTimestamp).toISOString()})`, ephemeral: true }).catch(console.error);
      continue;
    }

    const parsedPoint = parseInt(point, 10);
    if (isNaN(parsedPoint)) {
      interaction.followUp({ content: `Kunde inte tolka poängen i ditt meddelande: "${message.content}" (${new Date(message.createdTimestamp).toISOString()})`, ephemeral: true }).catch(console.error);
      continue;
    }

    score[course] = parsedPoint;
  }

  const scoreLines = Object.entries(score).map(([course, point]) => `${course}: ${point}`);
  if (scoreLines.length === 0) {
    await interaction.followUp({ content: "Hittade inga poängmeddelanden efter banmeddelandet.", ephemeral: true });
    return;
  }
  const totalPoints = Object.values(score).reduce((a, b) => a + b, 0);
  await interaction.editReply({ content: `${parsedCourseMessage}\nDina poäng (hål, kast):\n${scoreLines.join("\n")}\nTotalt: ${totalPoints}` });

  // Formatted compact score
  const fancyDate = new Date(courseMessage.createdTimestamp).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm", dateStyle: "long" });
  const scoreMessage = `-# ${fancyDate}\n${courseMessage.content} - <@${sender.id}> totalt: ${totalPoints}`;


  // Prompt about sending it as a message in the write channel
  await interaction.followUp({
    content: `Skicka resultatet?\n${blockQuote(scoreMessage)}`,
    components: [
      {
        type: 1,
        components: [
          { type: 2, label: "Ja", style: 1, customId: "send_score_yes" },
          { type: 2, label: "Nej", style: 2, customId: "send_score_no" },
        ],
      },
    ],
    ephemeral: true,
  });

  const filter = (i: MessageComponentInteraction) => i.customId === "send_score_yes" || i.customId === "send_score_no";
  const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 60000, max: 1 });
  collector?.on("collect", (i: MessageComponentInteraction) => {
    (async () => {
      if (i.customId === "send_score_yes") {
        if (!("send" in writeChannel)) {
          await i.update({ content: "Write channel is not text-based.", components: [] });
          return;
        }
        await i.update({ content: "Skickar...", components: [] });
        await writeChannel.send(scoreMessage);
      }
      else {
        await i.update({ content: "Skickar inte.", components: [] });
      }
    })()
      .catch((err: unknown) => {
        console.error("Error handling button interaction:", err);
        i.update({ content: "There was an error while processing your request.", components: [] }).catch(console.error);
      });
  });
  collector?.on("end", (_collected, reason) => {
    (async () => {
      if (reason === "time") {
        await interaction.followUp({ content: "ERROR: Timed out sending score message.", ephemeral: true }).catch(console.error);
      }
    })()
      .catch((err: unknown) => {
        console.error("Error handling collector end:", err);
        interaction.followUp({ content: "There was an error while processing your request.", ephemeral: true }).catch(console.error);
      });
  });
}

function isCourseMessage(content: string): boolean {
  const isOnlyString = /^[a-zA-ZåäöÅÄÖ]+$/.test(content);
  const lengthOk = content.length > 3 && content.length <= 20;
  return isOnlyString && lengthOk;
}

function blockQuote(text: string): string {
  return text.split("\n").map(line => `> ${line}`).join("\n");
}