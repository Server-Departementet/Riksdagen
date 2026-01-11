#!/bin/bash
cd /root/Riksdagen

git fetch --all
git checkout origin/spotify-rewrite --force

# Make /deploy-code executable
chmod +x deploy-code/*

# Build
bash deploy-code/build.sh

# Restart
systemctl restart next-start.service