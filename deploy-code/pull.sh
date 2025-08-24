#!/bin/bash

git fetch --all
git checkout origin/main --force

# Make /deploy-code executable
chmod +x deploy-code/*

# Build
npm i -g yarn
yarn install --frozen-lockfile
yarn prisma generate
CI=true yarn build

# Restart
reboot