#!/bin/bash

git fetch --all
git checkout origin/Dev --force

# Build
yarn install
yarn build

# Restart
reboot