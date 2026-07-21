## Environment Variables

Create a `.env` in the repo root — see [`.env.example`](.env.example) for every
variable and what it does.

## Auth

Login is Discord OAuth (`/api/auth/login`), sessions are signed JWT cookies.
A logged-in user gets the `minister` role if their Discord ID exists in the `User`
table, which the [Riksdagen-Backend](https://github.com/Server-Departementet/Riksdagen-Backend)
repo's `make-users` job populates from the guild's minister role.
Ministers connect their Spotify account via the button on `/spotify`; the refresh
token is stored in the `SpotifyAccount` table and used by the backend's recent-plays cron.

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


## DB

This web app connects to a mariadb database on the server hosting the backend.
All cron/data jobs (recent plays import, user sync) and the Discord bots live in
the [Riksdagen-Backend](https://github.com/Server-Departementet/Riksdagen-Backend) repo;
this repo is only the web site.