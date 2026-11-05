import "dotenv/config";
import sharp from "sharp";
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
 *
 * Also stores the mean colour of each minister's avatar, used for their line in
 * the /citat/stats charts.
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
  avatar: string | null; // Server-specific avatar, if set
  roles: string[];
  user: {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
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
      const avatarColor = await meanAvatarColor(member).catch((err: unknown) => {
        // Keep whatever colour is stored rather than failing the whole sync
        console.warn(`Could not get the avatar colour of ${member.user.id}:`, err);
        return undefined;
      });
      const user = {
        id: member.user.id,
        name: member.nick ?? member.user.global_name ?? member.user.username,
        avatarColor,
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

/** The avatar shown in the guild: the server avatar, else the account avatar, else Discord's default. */
function avatarUrl(member: GuildMember): string {
  if (member.avatar) {
    return `https://cdn.discordapp.com/guilds/${REGERINGEN_GUILD_ID}/users/${member.user.id}/avatars/${member.avatar}.png?size=64`;
  }
  if (member.user.avatar) {
    return `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=64`;
  }
  return `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(member.user.id) >> 22n) % 6n)}.png`;
}

/** Mean colour of the avatar as "#rrggbb", weighted by opacity so transparent corners don't count. */
async function meanAvatarColor(member: GuildMember): Promise<string> {
  const response = await fetch(avatarUrl(member));
  if (!response.ok) throw new Error(`Avatar request failed: ${response.status}`);
  const { data } = await sharp(Buffer.from(await response.arrayBuffer()))
    .resize(64, 64)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let r = 0, g = 0, b = 0, weight = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    const alpha = (data[i + 3] ?? 0) / 255;
    r += (data[i] ?? 0) * alpha;
    g += (data[i + 1] ?? 0) * alpha;
    b += (data[i + 2] ?? 0) * alpha;
    weight += alpha;
  }
  if (weight === 0) throw new Error("Avatar is fully transparent");
  return "#" + [r, g, b].map(c => Math.round(c / weight).toString(16).padStart(2, "0")).join("");
}
