const fs = require("node:fs");
const { Client, Events, GatewayIntentBits, ActivityType } = require("discord.js");

const requiredEnvVariables = [
    "DISCORD_BOT_TOKEN",
    "DISCORD_QUOTE_CHANNEL_ID",
];

type Quote = {
    quote: string;
    credited: string;
    context: string | null;
    publisher: string;
    publisherID: string;
    date: Date;
}

const startDiscordBot = () => {
    const client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences],
    });

    // ENV validation
    if (!requiredEnvVariables.every((env) => process.env[env])) {
        console.error("Missing environment variables: ", requiredEnvVariables.filter((env) => !process.env[env]));
        return;
    }

    client.login(process.env.DISCORD_BOT_TOKEN);

    client.on(Events.ClientReady, async () => {
        console.info(`Logged in as ${client.user?.tag}`);

        client.user?.setPresence({
            activities: [{ name: "Samlar data om Regeringen", type: ActivityType.Custom }],
        });

        // const quotesChannel = await client.channels.fetch(process.env.DISCORD_QUOTE_CHANNEL_ID);
        // if (quotesChannel) {
        //     const messages = await quotesChannel.messages.fetch({ limit: 100 });
        //     const quotes: Quote[] = messages.map((message: any) => {
        //         const regex = /["“”'‘’]([^"“”'‘’]+)["“”'‘’]\s*-\s*([^,.]+)(?:[,.]\s*(.*))?/;
        //         const match = message.content.match(regex);

        //         if (!match) {
        //             console.error("Could not parse message: ", message.content);
        //             return null;
        //         }

        //         const quoteContent = match[1];
        //         const creditedName = match[2];
        //         const context = match[3] || null;

        //         const quote: Quote = {
        //             quote: `\"${quoteContent}\"`,
        //             credited: creditedName,
        //             context: context,
        //             publisher: message.author.username,
        //             publisherID: message.author.id,
        //             date: new Date(message.createdTimestamp),
        //         };
        //         return quote;
        //     });

        //     fs.writeFileSync("quotes.json", JSON.stringify(quotes.filter(Boolean), null, 2));
        // } else {
        //     console.error("Could not find channel with id: ", process.env.DISCORD_QUOTE_CHANNEL_ID);
        // }
    });
}

startDiscordBot();
