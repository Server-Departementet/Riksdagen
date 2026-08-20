#!/bin/bash
# Runs as root on a web VM, streamed in by the deploy workflow after it has
# rsynced the freshly built standalone bundle to .next/standalone-new.
# Checks out the deployed commit (cron scripts run from the repo with tsx),
# swaps the standalone build in, and refreshes service + cron definitions.
set -e

SHA="${1:?usage: activate.sh <commit-sha>}"
APP=/home/riks/Riksdagen

runuser -u riks -- bash -c "
  set -e
  export NVM_DIR=\"\$HOME/.nvm\"
  . \"\$NVM_DIR/nvm.sh\"
  cd '$APP'
  git fetch origin
  git checkout --force --detach '$SHA'
  chmod +x systemd/*.sh
  corepack enable > /dev/null 2>&1 || true
  # Cap the heap: an uncached fetch otherwise balloons node past the
  # container's memory limit and the cgroup OOM-kills the install
  NODE_OPTIONS=--max-old-space-size=1024 yarn install --immutable
  yarn prisma generate
  if [ -f prisma.bot.config.ts ]; then yarn prisma generate --config prisma.bot.config.ts; fi
"

# Swap in the standalone build shipped by the workflow
rm -rf "$APP/.next/standalone-old"
if [ -d "$APP/.next/standalone" ]; then
  mv "$APP/.next/standalone" "$APP/.next/standalone-old"
fi
mv "$APP/.next/standalone-new" "$APP/.next/standalone"
cp "$APP/.env" "$APP/.next/standalone/.env"
chown -R riks:riks "$APP/.next"

# Log dir for the riks cron jobs (recent plays + minister sync)
mkdir -p /var/log/riksdagen-web
chown riks:riks /var/log/riksdagen-web

# Refresh service + cron definitions
cp "$APP/systemd/next-start.service" /etc/systemd/system/
crontab -u riks "$APP/systemd/cron"
crontab "$APP/systemd/cron.root"
systemctl daemon-reload
systemctl enable next-start.service > /dev/null 2>&1
systemctl restart next-start.service

printf '\n\033[1;32mDeployed %s\033[0m\n' "$SHA"
