#!/bin/bash

git fetch --all
git checkout origin/Dev --force

# Build
yarn install
yarn build

# Make /deploy-code executable
chmod +x deploy-code/*

# Restart
reboot