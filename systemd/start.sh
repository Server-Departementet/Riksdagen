#!/bin/bash

cd /home/riks/Riksdagen

if [ ! -f ".env" ]; then
    echo "No .env file found. Create it manually or run systemd/deploy.sh with a URL." 1>&2
    exit 1
fi

cd /home/riks/Riksdagen/.next/standalone

# Start in the standalone directory
node server.js &
wait
