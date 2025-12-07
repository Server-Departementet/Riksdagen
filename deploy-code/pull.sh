#!/bin/bash
cd /root/Riksdagen

git fetch --all
git checkout origin/main --force

# Make /deploy-code executable
chmod +x deploy-code/*

# Build
bash deploy-code/build.sh

# Restart
reboot