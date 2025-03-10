# !/bin/bash

cd ~/Riksdagen

# ENV file exists
if [ -f .env ]; then
  echo ".env file exists."
else
  echo ".env file does not exist. Exiting the script."
  exit 1
fi
# env.local file exists
if [ -f .env.local ]; then
  echo ".env.local file exists."
else
  echo ".env.local file does not exist. Exiting the script."
  exit 1
fi

# Checkout the branch or tag
# If the branch or tag is not provided, default to main
git fetch --all
if [ "$1" == "tag" ]; then
  echo "Checking out $2 tag."
  git checkout -f tags/$2

elif [ "$1" == "branch" ]; then
  echo "Checking out $2 branch."
  git checkout -f $2

else
  echo "Branch or tag is not provided. Defaulting to origin/main branch."
  git checkout -f origin/main
fi

# Run yarn build
yarn install
yarn build
# If yarn build fails, exit the script
if [ $? -ne 0 ]; then
  echo "yarn build failed. Exiting the script."
  exit 1
fi

# Reboot
echo "Please reboot the server to apply changes."
