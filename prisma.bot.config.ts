import "dotenv/config";
import type { PrismaConfig } from "prisma/config";
import { env } from "prisma/config";

// Config for the read-only client against the Riksdagen-Bot database (quotes).
// Generate with: yarn prisma generate --config prisma.bot.config.ts
export default {
  schema: "prisma/bot.schema.prisma",
  datasource: {
    url: env("QUOTES_DATABASE_URL"),
  },
} satisfies PrismaConfig;
