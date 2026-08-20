#!/bin/bash

# Load NVM properly
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Change to project directory
cd "$HOME/Riksdagen" || exit 1

# Run the script passed as argument. tsx is invoked directly instead of via
# `yarn tsx`: yarn leaks xfs-* temp dirs into /tmp (a tmpfs) on every run,
# which slowly eats the container's RAM.
exec ./node_modules/.bin/tsx "$@"
