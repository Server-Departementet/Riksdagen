#!/bin/bash

# Load NVM bin
export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 

cd /root/Riksdagen/
yarn start