const express = require("express");

const app = express();
const port = 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((_: any, res: any, next: any) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post("/api/oauth/discord", async (req: any, res: any) => {
    console.info("Got request");

    const body: { code: string } = req.body;

    if (!body || !body.code) {
        return res.status(400).json({ error: "Invalid request" });
    }

    // ENV validation
    if (
        !process.env.DISCORD_CLIENT_ID
        ||
        !process.env.DISCORD_CLIENT_SECRET
    ) {
        return res.status(500).json({ error: "Internal server error" });
    }

    const redirectURI = process.env.ENV === "server" ?
        "https://server-riksdagen.tailad6f63.ts.net/oauth/discord"
        :
        "http://localhost:3000/oauth/discord"
        ;

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
        return res.status(500).json({ error: "Internal server error" });
    }

    const tokenData = await tokenResponseData.json();

    console.log(tokenData);

    return res.status(200).json({ code: body.code });
});

app.listen(port, () => {
    console.info(`Server running on port ${port}`);
});