import "dotenv/config";
import { PrismaClient } from "@/lib/prisma/generated";
import { Client as DiscordClient, GatewayIntentBits } from "discord.js";
import { makeMariaDBAdapter } from "@/lib/prisma";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set in environment variables");
const DATABASE_URL = process.env.DATABASE_URL;
if (!process.env.DISCORD_BOT_TOKEN) throw new Error("DISCORD_BOT_TOKEN is not set in environment variables");
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!process.env.REGERINGEN_GUILD_ID) throw new Error("REGERINGEN_GUILD_ID is not set in environment variables");
const REGERINGEN_GUILD_ID = process.env.REGERINGEN_GUILD_ID;


makeUsers()
  .then(() => {
    console.log("Finished making users.");
    process.exitCode = 0;
  })
  .catch((err: unknown) => {
    console.error("Error making users:", err);
    process.exitCode = 1;
  })
  .then(() => process.exit())
  .catch(() => process.exit());

async function makeUsers() {
  const prisma = new PrismaClient(makeMariaDBAdapter(DATABASE_URL));

  /*
   * Get users nicknames on Discord via bot
   */
  const serverNicks: Record<string, string> = {};

  const discordClient = new DiscordClient({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
  await discordClient.login(DISCORD_BOT_TOKEN);
  async function onDiscordReady(client: DiscordClient) {
    if (!client.user) {
      throw new Error("Discord client user is not defined after ready");
    }
    console.info(`Logged in as ${client.user.tag}`);

    const guild = await client.guilds.fetch(REGERINGEN_GUILD_ID);
    const members = await guild.members.fetch();
    const ministers = members.filter(m => m.roles.cache.has("1167471191133528175")); // Minister role id
    console.info(`Fetched ${members.size} members, of which ${ministers.size} are ministers.`);

    for (const [memberId, member] of ministers) {
      serverNicks[memberId] = member.nickname ?? member.user.globalName ?? member.user.username;
    }

    await client.destroy()
      .catch((err: unknown) => {
        console.error("Error destroying Discord client:", err);
      });
  }
  await new Promise<void>((resolve, reject) => {
    discordClient.once("clientReady", () => {
      onDiscordReady(discordClient).then(resolve).catch((err: unknown) => {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Error in onDiscordReady:", error);
        reject(error);
      });
    });
  });

  for (const discordId in serverNicks) {
    await prisma.user.upsert({
      where: {
        id: discordId,
      },
      create: {
        id: discordId,
        name: serverNicks[discordId],
      },
      update: {
        id: discordId,
        name: serverNicks[discordId],
      },
    });
  }
}
