require("./discord/discord-bot.ts");


// DB basics
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const write = async (name: string) => {
    const user = await prisma.user.create({
        data: {
            name: name,
        }
    });

    console.log("Added user:", user);
};

const read = async () => {
    const user = await prisma.user.findMany();
    console.log(user);
};

write("John Doe")
    .catch(e => { throw e })
    .finally(async () => {
        await prisma.$disconnect();
    });

read()
    .catch(e => { throw e })
    .finally(async () => {
        await prisma.$disconnect();
    });