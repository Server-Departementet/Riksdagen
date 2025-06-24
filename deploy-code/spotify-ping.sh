#!/bin/bash

# Log output to a file for debugging
LOG_FILE="/home/riks/spotify-ping.log"

# Ping the API and log the result
echo "$(date): Pinging Spotify API" >> "$LOG_FILE"
curl -X POST -H "Content-Type: application/json" localhost:3000/api/spotify/post >> "$LOG_FILE" 2>&1
echo "" >> "$LOG_FILE"