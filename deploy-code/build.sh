#!/bin/bash

cd /root/Riksdagen

export CI=true

# Build
npm i -g yarn
yarn install --frozen-lockfile
yarn prisma migrate deploy
yarn prisma generate
CI=true yarn build

# Copy necessary files to the standalone directory
cp .env .next/standalone/
cp -r public .next/standalone/
cp -r cache .next/standalone/
cp -r .next/static .next/standalone/.next/

cd /root/Riksdagen