import { idGroups } from "./complete-usermap.ts";
import "dotenv/config";
import { env } from "node:process";
import { PrismaClient, User } from "../src/prisma/generated/client.js";
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

  /* 
   * Get users nicknames on Discord via bot
   */
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
    const ministers = members.filter(m => m.roles.cache.has("1167471191133528175")); // Minister role id
    console.info(`Fetched ${members.size} members, of which ${ministers.size} are ministers.`);

    for (const [memberId, member] of ministers) {
      serverNicks[memberId] = member.nickname ?? member.user.globalName ?? member.user.username;
    }

    await client.destroy()
      .catch((error) => {
        console.error("Error destroying Discord client:", error);
      });
  }
  await new Promise<void>((resolve, reject) => {
    discordClient.once("clientReady", () => {
      onDiscordReady(discordClient).then(resolve).catch((e) => {
        const error = e instanceof Error ? e : new Error(String(e));
        console.error("Error in onDiscordReady:", error);
        reject(error);
      });
    });
  });

  for (const discordId in serverNicks) {
    const savedIds = idGroups.find(g => g.discordId === discordId);
    await prisma.user.upsert({
      where: {
        id: discordId,
      },
      create: {
        id: discordId,
        name: serverNicks[discordId],
        clerkDevId: savedIds?.clerkDev,
        clerkProdId: savedIds?.clerkProd,
      },
      update: {
        id: discordId,
        name: serverNicks[discordId],
        clerkDevId: savedIds?.clerkDev,
        clerkProdId: savedIds?.clerkProd,
      },
    });
  }

  // Now the proper users are made but fk constraints may still point to old clerk ids.
  const allUsers = await prisma.user.findMany();
  const oldUsers = allUsers.filter(u => !u.name && !u.clerkDevId && !u.clerkProdId);
  const userMigrationMap: Record<string, User> = {};
  for (const oldUser of oldUsers) {
    const matchingNewUser = allUsers.find(u => u.clerkDevId === oldUser.id || u.clerkProdId === oldUser.id);
    userMigrationMap[oldUser.id] = matchingNewUser!;
  }
  for (const [oldUserId, newUser] of Object.entries(userMigrationMap)) {
    await prisma.trackPlay.updateMany({
      where: {
        userId: oldUserId,
      },
      data: {
        userId: newUser.id,
      },
    });
  }

  // Delete old users (should throw if fk constraints are still present).
  await prisma.user.deleteMany({
    where: {
      id: { in: Object.keys(userMigrationMap) },
    },
  });
}