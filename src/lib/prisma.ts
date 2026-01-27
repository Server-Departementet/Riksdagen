import "dotenv/config";
import { PrismaClient } from "@/prisma/generated";
import { createMariaDbAdapter } from "./mariadb-url";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbURL = process.env.DATABASE_URL;
if (!dbURL) {
  throw new Error("DATABASE_URL is not defined");
}
const adapter = createMariaDbAdapter(dbURL);

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});