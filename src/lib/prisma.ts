import "dotenv/config";
import { PrismaClient } from "@/prisma/generated";
import { makeMariaDBAdapter } from "./mariadb-adapter";
import { env } from "node:process";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const { DATABASE_URL } = env;
if (!DATABASE_URL) throw new Error("DATABASE_URL is not defined");

export const prisma = globalForPrisma.prisma || new PrismaClient(makeMariaDBAdapter(DATABASE_URL));

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});