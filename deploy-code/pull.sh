#!/bin/bash

git fetch --all
git checkout origin/main --force

# Build
yarn install
yarn build
bash /root/Riksdagen/deploy-code/deploy.sh

# Make /deploy-code executable
chmod +x deploy-code/*

# Restart
reboot