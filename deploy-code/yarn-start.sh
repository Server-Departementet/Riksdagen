#!/bin/bash

# Add Node.js bin directory to PATH
export PATH="/root/.nvm/versions/node/v23.10.0/bin:$NVM_BIN:$PATH"

cd /root/Riksdagen/
/root/.nvm/versions/node/v23.10.0/bin/yarn start &
/root/.nvm/versions/node/v23.10.0/bin/yarn prisma studio &
wait