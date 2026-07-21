#!/bin/bash
# First-time setup. Run as root, after cloning the repo to /home/riks/Riksdagen
# and installing nvm + node for the riks user.
set -e

# Service user
id riks &>/dev/null || useradd --create-home --shell /bin/bash riks

# Handle .env file
if [ -n "$1" ]; then
    # If an argument is provided, download the .env file from the URL
    echo "Downloading .env file from $1"
    curl -o /home/riks/Riksdagen/.env "$1"
fi
if [ ! -f /home/riks/Riksdagen/.env ]; then
    echo "No .env file found. Please provide a URL to download it from or create it manually." 1>&2
    exit 1
fi
chown riks:riks /home/riks/Riksdagen/.env
chmod 600 /home/riks/Riksdagen/.env

chown -R riks:riks /home/riks/Riksdagen

# Build, install service + cron, start
bash /home/riks/Riksdagen/systemd/update.sh
systemctl enable next-start.service
