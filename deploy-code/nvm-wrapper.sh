#!/bin/bash

# Load NVM properly
export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Change to project directory
cd /root/Riksdagen || exit 1

# Run the script passed as argument
exec yarn tsx "$@"