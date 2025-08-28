#!/bin/bash

cd /root/Riksdagen || exit 1

git fetch --all
git checkout origin/dev --force

# Make /deploy-code executable
chmod +x deploy-code/*

# Build
bash deploy-code/build.sh

# Restart
reboot