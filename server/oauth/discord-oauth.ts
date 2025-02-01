const express = require("express");

// Express setup
const app = express();
const port = 4000;
let lastRequest = 0;
const debounceTime = 500;
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((_: any, res: any, next: any) => { // CORS
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Where Discord sends the user after they authorize the app. Matches with discordOAuthLink in (app)/layout.tsx
const redirectURI = process.env.ENV === "server" ?
    "https://server-riksdagen.tailad6f63.ts.net/oauth/discord"
    :
    "http://localhost:3000/oauth/discord"
    ;

// Endpoint for receiving Discord access and refresh tokens
app.post("/api/oauth/discord", async (req: any, res: any) => {

    // Debounce time on requests
    if (Date.now() - lastRequest < debounceTime) {
        console.warn("Too many requests from client");
        return res.status(429).json({ error: "Too many requests" });
    }
    lastRequest = Date.now();

    const body: { code: string } = req.body;

    // Request validation
    if (!body || !body.code) {
        console.warn("Invalid request from client", body);
        return res.status(400).json({ error: "Invalid request" });
    }

    // ENV validation
    if (
        !process.env.DISCORD_CLIENT_ID
        ||
        !process.env.DISCORD_CLIENT_SECRET
    ) {
        console.error("Missing environment variables: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET");
        return res.status(500).json({ error: "Internal server error" });
    }

    // Requesting access token from Discord
    const tokenResponseData = await fetch(
        "https://discord.com/api/oauth2/token",
        {
            method: "POST",
            body: new URLSearchParams({
                "client_id": process.env.DISCORD_CLIENT_ID,
                "client_secret": process.env.DISCORD_CLIENT_SECRET,
                "code": body.code,
                "grant_type": "authorization_code",
                "redirect_uri": redirectURI,
                "scope": "identify",
            }).toString(),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }
    );

    if (!tokenResponseData.ok) {
        console.error("Token response not ok", tokenResponseData);
        return res.status(500).json({ error: "Internal server error" });
    }

    const tokenData = await tokenResponseData.json();

    console.log("Token", tokenData); // TODO - remove

    // Get identity of the user
    const identityResponseData = await fetch(
        "https://discord.com/api/v10/users/@me",
        {
            headers: {
                "Authorization": `${tokenData.token_type} ${tokenData.access_token}`,
            },
        }
    );

    if (!identityResponseData.ok) {
        console.error("Identity response not ok", identityResponseData);
        return res.status(500).json({ error: "Internal server error" });
    }

    const identityData = await identityResponseData.json();

    console.log("Identity", identityData); // TODO - remove

    const user = {
        id: identityData.id,
        username: identityData.username,
        displayName: identityData.global_name,
        avatar: `https://cdn.discordapp.com/avatars/${identityData.id}/${identityData.avatar}.png`,
        discordRefreshToken: tokenData.refresh_token,
    }

    // Add or update user in DB
    await prisma.user.create({ data: user })
        .catch((error: any) => {
            // Existing user in DB
            if (error.code === "P2002") {
                console.info("Updated existing user", user);
                return prisma.user.update({
                    where: { id: user.id },
                    data: user,
                });
            }

            console.error("Error creating user", error);
            return res.status(500).json({ error: "Internal server error" });
        })
        .finally(() => {
            prisma.$disconnect();
        });

    return res.status(200).json({ success: "Logged in successfully" });
});

app.listen(port, () => {
    console.info(`Server running on port ${port}`);
});