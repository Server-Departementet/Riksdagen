import { Client as DiscordClient, GatewayIntentBits } from "discord.js";

if (!process.env.DISCORD_BOT_TOKEN) throw new Error("DISCORD_BOT_TOKEN is not set in environment variables");
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!process.env.DISCGOLF_GUILD_ID) throw new Error("DISCGOLF_GUILD_ID is not set in environment variables");
const DISCGOLF_GUILD_ID = process.env.DISCGOLF_GUILD_ID;
if (!process.env.DISCGOLF_CHANNEL_ID) throw new Error("DISCGOLF_CHANNEL_ID is not set in environment variables");
const DISCGOLF_CHANNEL_ID = process.env.DISCGOLF_CHANNEL_ID;

const discordClient = new DiscordClient({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
await discordClient.login(DISCORD_BOT_TOKEN);
async function onDiscordReady(client: DiscordClient) {
  if (!client.user) {
    throw new Error("Discord client user is not defined after ready");
  }
  console.info(`Logged in as ${client.user.tag}`);

  const guild = await client.guilds.fetch(DISCGOLF_GUILD_ID);

  await client.destroy()
    .catch((err: unknown) => {
      console.error("Error destroying Discord client:", err);
    });
}
discordClient.once("clientReady", () => {
  onDiscordReady(discordClient)
    .catch((err: unknown) => {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error in onDiscordReady:", error);
    })
    .finally(() => {
      process.exit();
    });
});