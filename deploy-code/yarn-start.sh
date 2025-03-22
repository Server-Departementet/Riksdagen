#!/bin/bash

# If NVM_BIN is set, use it directly
if [ -n "$NVM_BIN" ]; then
    cd /root/Riksdagen/
    ${NVM_BIN}/yarn start
else
    # Fallback to loading NVM properly if NVM_BIN isn't set
    export NVM_DIR="/root/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    cd /root/Riksdagen/
    yarn start
fi