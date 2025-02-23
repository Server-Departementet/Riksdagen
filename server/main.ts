
/// <reference path="extend/rich-console.ts" />

const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(process.cwd(), ".env") });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/// <reference path="discord/discord-bot.ts" />