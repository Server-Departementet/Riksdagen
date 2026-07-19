import "dotenv/config";
import { PrismaClient } from "@/lib/prisma-bot/generated/client";
import { makeMariaDBAdapter } from "@/lib/prisma/mariadb-adapter";
import { env } from "node:process";

// Read-only client against the Riksdagen-Bot database (canonical quotes over LAN).
const globalForBotPrisma = global as unknown as { botPrisma: PrismaClient };

const { QUOTES_DATABASE_URL } = env;
if (!QUOTES_DATABASE_URL) throw new Error("QUOTES_DATABASE_URL is not defined");

export const botPrisma = globalForBotPrisma.botPrisma || new PrismaClient(makeMariaDBAdapter(QUOTES_DATABASE_URL));

if (process.env.NODE_ENV !== "production") globalForBotPrisma.botPrisma = botPrisma;

process.on("beforeExit", () => {
  botPrisma.$disconnect()
    .catch((err: unknown) => {
      console.error("Error disconnecting bot Prisma Client:", err);
    });
});
