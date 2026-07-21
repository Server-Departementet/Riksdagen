#!/bin/bash

cd /home/riks/Riksdagen

export CI=true

# Build
corepack enable
yarn install --immutable --immutable-cache
yarn prisma generate
yarn prisma generate --config prisma.bot.config.ts
CI=true yarn build
yarn cache clean

# Copy necessary files to the standalone directory
mkdir -p .next/standalone/
cp .env .next/standalone/
cp -r public .next/standalone/
cp -r cache .next/standalone/
cp -r .next/static .next/standalone/.next/

cd /home/riks/Riksdagen

chmod +x /home/riks/Riksdagen/systemd/*.sh
