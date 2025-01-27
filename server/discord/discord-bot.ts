const { Client, Events, GatewayIntentBits, ActivityType } = require("discord.js");
const dotenv = require("dotenv");
const path = require("node:path");

dotenv.config({ path: path.join(process.cwd(), ".env") });

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences],
});

client.login(process.env.DISCORD_TOKEN);

client.on(Events.ClientReady, async () => {
    console.info(`Logged in as ${client.user?.tag}`);

    client.user?.setPresence({
        activities: [{ name: "Samlar data om Regeringen", type: ActivityType.Custom }],
    });
});
