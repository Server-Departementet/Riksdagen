const { Client, Events, GatewayIntentBits, ActivityType } = require("discord.js");

const startDiscordBot = () => {
    const client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences],
    });

    // ENV validation
    if (!process.env.DISCORD_BOT_TOKEN) {
        console.error("Missing environment variables: DISCORD_BOT_TOKEN");
        return;
    }

    client.login(process.env.DISCORD_BOT_TOKEN);

    client.on(Events.ClientReady, async () => {
        console.info(`Logged in as ${client.user?.tag}`);

        client.user?.setPresence({
            activities: [{ name: "Samlar data om Regeringen", type: ActivityType.Custom }],
        });
    });
}

startDiscordBot();