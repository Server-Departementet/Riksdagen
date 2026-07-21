## Environment Variables

```bash
DATABASE_URL=""
# For seeding (don't be silly, don't put this on the server)
REMOTE_DB_URL=""

# Session cookie signing secret, generate with e.g. `openssl rand -base64 32`
AUTH_SECRET=""

# For generating links and other stuff in the app (also the OAuth redirect base)
CANONICAL_URL=""

# Discord OAuth (login). Can be the same Discord application as the bot.
# Add "<CANONICAL_URL>/api/auth/callback/discord" as a redirect in the Discord developer portal.
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""

# Spotify OAuth (ministers connect their account on /spotify; tokens are used by scripts/post-recent-plays.ts)
# Add "<CANONICAL_URL>/api/auth/callback/spotify" as a redirect in the Spotify developer dashboard.
SPOTIFY_CLIENT_ID=""
SPOTIFY_CLIENT_SECRET=""

# Discord Bot (used by scripts/make-users.ts and seeding)
DISCORD_BOT_TOKEN=""
REGERINGEN_GUILD_ID=""
QUOTE_CHANNEL_ID=""
QUIZ_CHANNEL_ID=""
```

## Auth

Login is Discord OAuth (`/api/auth/login`), sessions are signed JWT cookies.
A logged-in user gets the `minister` role if their Discord ID exists in the `User`
table, which `yarn tsx scripts/make-users.ts` populates from the guild's minister role.
Ministers connect their Spotify account via the button on `/spotify`; the refresh
token is stored in the `SpotifyAccount` table and used by the recent-plays cron.

### Required files
Read `scripts/secrets.md` for more info on required files.

Contact a contributor for these files.


## Setup

### Mariadb
You are a strong independent woman who can install mariadb on your own :sparkles:

Make sure your user has the right permissions to create databases (if you want prisma to create it for you) or full access to the database you create.

```sql
-- I am lazy
CREATE USER 'riks'@'localhost' IDENTIFIED BY 'someCoolPassword';
CREATE DATABASE riksdagen;
GRANT ALL PRIVILEGES ON riksdagen.* TO 'riks'@'localhost';
FLUSH PRIVILEGES;
-- But don't be silly in production, use other credentials plz
```

### App setup

```bash
# Install dependencies
yarn
# Make Prisma types
yarn prisma generate
# Create db (destructive?)
yarn prisma db push
# Seed db via a remote connection
yarn prisma db seed

# Optional, you will get a bunch of rejected requests since it's not throttled and it fetches a lot from spotify
# idk, maybe you'll get IP-banned (✿◠‿◠)
yarn seed-colors
```


## Commands

```bash
# Running dev server
yarn dev
# Building 
yarn build
# Running the built app
yarn start

# Debugging
yarn lint
# Yarn lint is your friend, it calls on the typescript transpiler and eslint
```


## Discord bot

```bash
# Scrape quotes channel, saves to scripts/quotes/out/quotes.json
yarn tsx scripts/quotes/quotes.ts

# Run the quiz (used by cron and manually when developing)
yarn tsx scripts/quiz/quiz.ts # --dry-run # does not send messages
```


## DB

This web app connects to a mariadb database on the server hosting the bots. 