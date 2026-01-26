### Environment Variables

```bash
DATABASE_URL=""
# For seeding (don't be dumb, don't put this on the server)
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

#### Required files
- Seeding
  - `scripts/complete-usermap.ts`
- Quiz
  - `scripts/discord/name-variants`


### Setup

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
yarn seed-colors
```


### Commands

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


### Discord bot

```bash
# Scrape quotes channel, saves to scripts/discord/quotes.json
yarn tsx scripts/discord/quotes.ts

# Run the quiz (used by cron and manually when developing)
yarn tsx scripts/discord/quiz.ts # --dry-run # does not send messages
```