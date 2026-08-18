import "dotenv/config";
import { PrismaClient } from "@/lib/prisma/generated";
import { makeMariaDBAdapter } from "@/lib/prisma";

/**
 * Sync guild members with the Minister role into this environment's User table.
 * The User table doubles as the minister allowlist: Discord OAuth login grants
 * the `minister` role iff the Discord ID exists here.
 *
 * Uses Discord's REST API directly (no gateway connection); the bot token's
 * application must have the Server Members privileged intent enabled and be a
 * member of the guild. Runs from cron on each web server (systemd/cron).
 */

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set in environment variables");
const DATABASE_URL = process.env.DATABASE_URL;
if (!process.env.DISCORD_BOT_TOKEN) throw new Error("DISCORD_BOT_TOKEN is not set in environment variables");
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!process.env.REGERINGEN_GUILD_ID) throw new Error("REGERINGEN_GUILD_ID is not set in environment variables");
const REGERINGEN_GUILD_ID = process.env.REGERINGEN_GUILD_ID;

const MINISTER_ROLE_ID = "1167471191133528175";

type GuildMember = {
  nick: string | null;
  roles: string[];
  user: {
    id: string;
    username: string;
    global_name: string | null;
  };
};

makeUsers()
  .then(() => {
    console.log("Finished making users.");
    process.exitCode = 0;
  })
  .catch((err: unknown) => {
    console.error("Error making users:", err);
    process.exitCode = 1;
  });

async function makeUsers() {
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${REGERINGEN_GUILD_ID}/members?limit=1000`,
    { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } },
  );
  if (!response.ok) {
    throw new Error(`Discord member list request failed: ${response.status} ${await response.text()}`);
  }
  const members = await response.json() as GuildMember[];
  const ministers = members.filter((member) => member.roles.includes(MINISTER_ROLE_ID));
  console.info(`Fetched ${members.length} members, of which ${ministers.length} are ministers.`);

  const prisma = new PrismaClient(makeMariaDBAdapter(DATABASE_URL));
  try {
    for (const member of ministers) {
      const user = {
        id: member.user.id,
        name: member.nick ?? member.user.global_name ?? member.user.username,
      };
      await prisma.user.upsert({
        where: { id: user.id },
        create: user,
        update: user,
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}
