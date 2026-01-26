## Environment Variables

```bash
DATABASE_URL=""
# For seeding (don't be silly, don't put this on the server)
REMOTE_DB_URL=""

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""

# For generating links and other stuff in the app
CANONICAL_URL=""

# Discord Bot (also used in seeding)
DISCORD_BOT_TOKEN=""
REGERINGEN_GUILD_ID=""
QUOTE_CHANNEL_ID=""
QUIZ_CHANNEL_ID=""
```

### Required files
- Seeding
  - `scripts/complete-usermap.ts`
- Quiz
  - `scripts/discord/name-variants`

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
# Scrape quotes channel, saves to scripts/discord/quotes.json
yarn tsx scripts/discord/quotes.ts

# Run the quiz (used by cron and manually when developing)
yarn tsx scripts/discord/quiz.ts # --dry-run # does not send messages
```