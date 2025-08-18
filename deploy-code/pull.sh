#!/bin/bash

git fetch --all
git checkout origin/main --force

# Make /deploy-code executable
chmod +x deploy-code/*

# Build
bash /root/Riksdagen/deploy-code/deploy.sh

# Restart
reboot