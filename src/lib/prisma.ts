import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbURL = process.env.DATABASE_URL;
if (!dbURL) {
  throw new Error("DATABASE_URL is not defined");
}
const adapter = new PrismaMariaDb({
  host: new URL(dbURL).hostname,
  port: Number(new URL(dbURL).port),
  user: new URL(dbURL).username,
  password: new URL(dbURL).password,
  database: new URL(dbURL).pathname.slice(1),
});

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

process.on("beforeExit", () => {
  prisma.$disconnect();
});