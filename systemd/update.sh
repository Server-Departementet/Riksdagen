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
  git checkout -B dev --force origin/dev

  printf "\n\033[1;32m================= UPDATED TO =================\033[0m\n"
  git log -1 --date=format:"%Y-%m-%d %H:%M:%S" --format="  commit:  %h%n  date:    %cd%n  message: %s"
  printf "\033[1;32m==============================================\033[0m\n\n"

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
