# Take args: branch or tag (default: main)
# Example: ./deploy.sh tag v1.0.0
# Example: ./deploy.sh branch main
# Example: ./deploy.sh branch Welcome-Page

# Checkout the branch or tag
# If the branch or tag is not provided, default to main
git fetch --all
if [ "$1" == "tag" ]; then
    git checkout tags/$2
elif [ "$1" == "branch" ]; then
    git checkout $2
else
    git checkout origin/main
    # Inform user that the branch or tag is not provided
    echo "Branch or tag is not provided. Defaulting to origin/main branch."
fi

# Run yarn install
yarn install
# If yarn install fails, exit the script
if [ $? -ne 0 ]; then
    echo "yarn install failed. Exiting the script."
    exit 1
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