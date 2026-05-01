#!/bin/bash
set -e
cd /root/Riksdagen
source /root/.nvm/nvm.sh
exec yarn tsx scripts/discgolf/discgolf.ts
