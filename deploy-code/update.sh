#!/bin/bash

git fetch --all
git checkout origin/Dev --force

# Build
yarn install
yarn build

# Make /deploy-code executable
chmod +x deploy-code/*.sh

# Make sure riks user owns the project files
chown -R riks:riks .

# Restart
reboot