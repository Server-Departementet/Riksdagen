import "dotenv/config";
import { env } from "node:process";
import { Client as DiscordClient, GatewayIntentBits, } from "discord.js";
import { PrismaClient } from "../../src/prisma/generated/index.js";
import fs from "node:fs";
import { Quote } from "./types.ts";
import { makeMariaDBAdapter } from "../../src/lib/mariadb-adapter.ts";

const {
  DATABASE_URL,
  CANONICAL_URL,
} = env;

if (!DATABASE_URL) throw new Error("DATABASE_URL is not set in environment variables");
if (!CANONICAL_URL) throw new Error("CANONICAL_URL is not set in environment variables");

const discordClient = new DiscordClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessagePolls],
});
const prisma = new PrismaClient(makeMariaDBAdapter(DATABASE_URL));
const users = Object.fromEntries((
  await prisma.user.findMany()
).map((u) => [u.id, u]));

main()
  .then(() => {
    console.info("Script finished successfully");
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error("Script failed with error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await discordClient.destroy();
    await prisma.$disconnect();
  });

async function main() {
  const statFolder = "scripts/discord/quote-stats";
  const senderStatsJSONPath = `${statFolder}/sender-stats.json`;
  const quoteeStatsJSONPath = `${statFolder}/quotee-stats.json`;
  const senderStatsMDPath = `${statFolder}/sender-stats.md`;
  const quoteeStatsMDPath = `${statFolder}/quotee-stats.md`;
  if (!fs.existsSync(statFolder)) {
    fs.mkdirSync(statFolder);
  }

  const availableQuotes = (JSON.parse(fs.readFileSync("scripts/discord/quotes.json", "utf-8")) as Quote[])
  console.info(`Loaded ${availableQuotes.length} available quotes for quiz`);

  const senderCounts: Record<string, number> = {};
  const quoteeCounts: Record<string, number> = {};

  for (const quote of availableQuotes) {
    const sender = users[quote.authorId].name ?? quote.authorId;
    senderCounts[sender] = (senderCounts[sender] ?? 0) + 1;
    const quotee = users[quote.quoteeId ?? quote.quotee]?.name ?? quote.quoteeId ?? quote.quotee;
    quoteeCounts[quotee] = (quoteeCounts[quotee] ?? 0) + 1;
  }

  const sortedSenderCounts = Object.fromEntries(
    Object.entries(senderCounts).sort(([, countA], [, countB]) => countB - countA)
  );
  const sortedQuoteeCounts = Object.fromEntries(
    Object.entries(quoteeCounts).sort(([, countA], [, countB]) => countB - countA)
  );

  fs.writeFileSync(senderStatsJSONPath, JSON.stringify(sortedSenderCounts, null, 2), "utf-8");
  fs.writeFileSync(quoteeStatsJSONPath, JSON.stringify(sortedQuoteeCounts, null, 2), "utf-8");

  // Format the stats as md and save to file
  const senderHeader = `
| Namn            | Antal skickade citat |
| --------------- | -------------------- |`;
  const quoteeHeader = `
| Namn            | Antal citeringar     |
| --------------- | -------------------- |`;

  const senderRows = Object.entries(sortedSenderCounts).map(([name, count]) => `| ${name} | ${count} |`);
  const quoteeRows = Object.entries(sortedQuoteeCounts).map(([name, count]) => `| ${name} | ${count} |`);

  fs.writeFileSync(senderStatsMDPath, [senderHeader, ...senderRows].join("\n"), "utf-8");
  fs.writeFileSync(quoteeStatsMDPath, [quoteeHeader, ...quoteeRows].join("\n"), "utf-8");
}
