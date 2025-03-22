#!/bin/bash

git fetch --all
git reset --hard origin/master

# Build
yarn install
yarn build

# Restart
reboot