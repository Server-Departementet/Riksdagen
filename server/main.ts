require("./discord/discord-bot.ts");


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