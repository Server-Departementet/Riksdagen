#!/bin/bash
# tsx.sh with a timestamp on every output line. Used by the cron jobs, whose
# logs go to plain files — the systemd services get timestamps from journald
# and should keep using tsx.sh directly.

"$(dirname "$0")/tsx.sh" "$@" 2>&1 | while IFS= read -r line || [[ -n $line ]]; do
  printf '[%(%Y-%m-%d %H:%M:%S)T] %s\n' -1 "$line"
done
exit "${PIPESTATUS[0]}"
