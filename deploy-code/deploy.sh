#!/bin/bash

export CI=true

yarn install --frozen-lockfile
yarn build

# Copy necessary files to the standalone directory
cp .env .next/standalone/
cp -r public .next/standalone/


cd .next
cp -r static standalone/.next/

cd standalone

# Start in the standalone directory
node server.js &
(cd ../../ && yarn prisma studio &) &
wait