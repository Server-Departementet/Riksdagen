# !/bin/bash

# Takes args: branch or tag (default: main)
# Example: ./deploy.sh tag v1.0.0
# Example: ./deploy.sh branch main
# Example: ./deploy.sh branch Welcome-Page

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
yarn build
# If yarn build fails, exit the script
if [ $? -ne 0 ]; then
    echo "yarn build failed. Exiting the script."
    exit 1
fi

# Reboot
echo "Rebooting the system. Please wait..."
sudo systemctl reboot
