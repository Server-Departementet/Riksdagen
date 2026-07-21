#!/bin/bash
# Run as root: app steps run as the riks user, system steps as root.
set -e

REPO=/home/riks/Riksdagen

runuser -u riks -- bash -c '
  set -e
  export NVM_DIR="$HOME/.nvm"
  . "$NVM_DIR/nvm.sh"
  cd "$HOME/Riksdagen"

  git fetch origin
  git checkout -B main --force origin/main

  chmod +x systemd/*.sh

  # Build (aborts the update on failure, keeping the running app)
  bash systemd/build.sh
'

# Refresh service + cron definitions (cron holds the maintenance reboot, so it is root's)
cp "$REPO/systemd/next-start.service" /etc/systemd/system/
crontab "$REPO/systemd/cron"

# Restart
systemctl daemon-reload
systemctl restart next-start.service
