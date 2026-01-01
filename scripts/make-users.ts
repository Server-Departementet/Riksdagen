import { idGroups } from "./complete-usermap.ts";
import "dotenv/config";
import { env } from "node:process";
import { PrismaClient } from "../src/prisma/generated/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Client as DiscordClient, GatewayIntentBits } from "discord.js";

if (!idGroups || typeof idGroups !== "object") {
  throw new Error("Invalid idGroups data.");
}
if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}
if (!env.DISCORD_BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN is not set in environment variables");
}
if (!env.REGERINGEN_GUILD_ID) {
  throw new Error("REGERINGEN_GUILD_ID is not set in environment variables");
}

makeUsers()
  .then(() => {
    console.log("Finished making users.");
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error("Error making users:", error);
    process.exitCode = 1;
  })
  .then(() => process.exit())
  .catch(() => process.exit());

async function makeUsers() {
  const dbURL = new URL(env.DATABASE_URL!);
  const adapter = new PrismaMariaDb({
    host: dbURL.hostname,
    port: Number(dbURL.port),
    user: dbURL.username,
    password: dbURL.password,
    database: dbURL.pathname.slice(1),
  });
  const prisma = new PrismaClient({ adapter });

  const serverNicks: Record<string, string> = {};

  const discordClient = new DiscordClient({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
  await discordClient.login(env.DISCORD_BOT_TOKEN);
  async function onDiscordReady(client: DiscordClient) {
    if (!client.user) {
      throw new Error("Discord client user is not defined after ready");
    }
    console.info(`Logged in as ${client.user.tag}`);

    const guild = await client.guilds.fetch(env.REGERINGEN_GUILD_ID!);
    const members = await guild.members.fetch();

    for (const discordId of idGroups.map(g => g.discordId)) {
      const member = members.find(m => m.user.id === discordId);
      if (member) {
        serverNicks[discordId] = member.nickname ?? member.user.globalName ?? member.user.username;
      }
    }

    await client.destroy()
      .catch((error) => {
        console.error("Error destroying Discord client:", error);
      });
  }
  await new Promise<void>((resolve, reject) => {
    discordClient.once("ready", () => {
      onDiscordReady(discordClient).then(resolve).catch((e) => {
        const error = e instanceof Error ? e : new Error(String(e));
        console.error("Error in onDiscordReady:", error);
        reject(error);
      });
    });
  });

  for (const idGroup of idGroups) {
    await prisma.user.upsert({
      where: {
        id: idGroup.discordId, // TODO this won't match if the user is still on 
      },
      create: {
        id: idGroup.discordId,
        name: serverNicks[idGroup.discordId],
        clerkDevId: idGroup.clerkDev,
        clerkProdId: idGroup.clerkProd,
      },
      update: {
        id: idGroup.discordId,
        name: serverNicks[idGroup.discordId],
        clerkDevId: idGroup.clerkDev,
        clerkProdId: idGroup.clerkProd,
      },
    });
  }
}