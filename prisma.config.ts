import path from "node:path";
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/* 
 * Prisma config 
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),

  datasource: {
    url: env("DATABASE_URL"),
  },

  migrations: {
    seed: "tsx prisma/seed.ts",
    path: path.join("prisma", "migrations"),
  },
});