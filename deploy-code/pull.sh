#!/bin/bash

git fetch --all
git checkout origin/main --force

# Build
yarn install --frozen-lockfile
yarn prisma generate
yarn build
bash /root/Riksdagen/deploy-code/deploy.sh

# Make /deploy-code executable
chmod +x deploy-code/*

# Restart
reboot