const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(process.cwd(), ".env") });

/// <reference path="extend/console.ts" />
/// <reference path="discord/discord-bot.ts" />
/// <reference path="oauth/discord-oauth.ts" />

// // DB basics
// const { PrismaClient } = require("@prisma/client");

// const prisma = new PrismaClient();

// const write = async () => {
//     const user = await prisma.user.create({
//         data: {
//             username: "John Doe" + Date.now(),
//             nickname: "John",
//             avatar: "url",
//             refreshToken: "COol token",
//         }
//     });

//     console.log("Added user:", user);
// };

// const read = async () => {
//     const user = await prisma.user.findMany();
//     console.log(user);
// };

// write()
//     .catch(e => { throw e })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });

// read()
//     .catch(e => { throw e })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });