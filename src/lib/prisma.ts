import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/prisma/generated";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbEnv = process.env.DATABASE_URL;
if (!dbEnv) {
  throw new Error("DATABASE_URL is not defined");
}
const dbURL = new URL(dbEnv);
const adapter = new PrismaMariaDb({
  host: decodeURI(dbURL.hostname),
  port: Number(decodeURI(dbURL.port)),
  user: decodeURI(dbURL.username),
  password: decodeURI(dbURL.password),
  database: decodeURI(dbURL.pathname.slice(1)),
  connectionLimit: 5,
});

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});