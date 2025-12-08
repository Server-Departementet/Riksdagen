#!/bin/bash

cd /root/Riksdagen

# Handle .env file
if [ -n "$1" ]; then
    # If an argument is provided, download the .env file from the URL
    echo "Downloading .env file from $1"
    curl -o .env "$1"
    if [ ! -f .env ]; then
        echo "Failed to download .env file from $1" 1>&2
        exit 1
    fi
elif [ ! -f ".env" ]; then
    # If no argument is provided and .env file does not exist, exit
    echo "No .env file found. Please provide a URL to download it from or create it manually." 1>&2
    exit 1
fi

# Build
bash deploy-code/build.sh

# Enable the the services
cp deploy-code/spotify-ping.service /etc/systemd/system/
cp deploy-code/spotify-ping.timer /etc/systemd/system/
cp deploy-code/next-start.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now spotify-ping.timer
systemctl enable --now next-start.service

# Log if the timer is active
echo "Spotify ping timer status:"
sudo systemctl list-timers spotify-ping.timer

cd /root/Riksdagen/.next/standalone

# Start in the standalone directory
node server.js &
(cd ../../ && yarn prisma studio --port 5555 --browser none &) &
wait