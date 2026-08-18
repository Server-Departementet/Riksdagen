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

  printf "\n\033[1;32m================= UPDATED TO =================\033[0m\n"
  git log -1 --date=format:"%Y-%m-%d %H:%M:%S" --format="  commit:  %h%n  date:    %cd%n  message: %s"
  printf "\033[1;32m==============================================\033[0m\n\n"

  chmod +x systemd/*.sh

  # Build (aborts the update on failure, keeping the running app)
  bash systemd/build.sh
'

# Log dir for the riks cron jobs (recent plays + minister sync)
mkdir -p /var/log/riksdagen-web
chown riks:riks /var/log/riksdagen-web

# Refresh service + cron definitions
cp "$REPO/systemd/next-start.service" /etc/systemd/system/
crontab -u riks "$REPO/systemd/cron"
crontab "$REPO/systemd/cron.root"

# Restart
systemctl daemon-reload
systemctl restart next-start.service
