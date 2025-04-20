#!/bin/bash

git fetch --all
git checkout origin/Dev

# Build
yarn install
yarn build

# Restart
reboot