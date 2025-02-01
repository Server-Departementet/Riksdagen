# !/bin/bash

# Save start cwd
START_CWD=$(pwd)

# Flag handling
SKIP_INSTALL_CHECK=false
while getopts "s" opt; do
    case ${opt} in
    s)
        SKIP_INSTALL_CHECK=true
        ;;
    \?)
        echo "Usage: cmd [-s]"
        echo "  -s  Skip install checks"
        exit 1
        ;;
    esac
done

# Apt update
echo "Updating apt..."
sudo apt-get update

# Install Tailscale
read -p "Paste the generated Tailscale server install script (enter to skip): " TAILSCALE_SCRIPT
if [ -n "$TAILSCALE_SCRIPT" ]; then
    echo "Running Tailscale install script..."
    sudo $TAILSCALE_SCRIPT
fi

# Install Git
if [ "$SKIP_INSTALL_CHECK" = false ]; then
    echo "Checking if Git is installed..."
    if [ -x "$(command -v git)" ]; then
        echo "Git is already installed."
    else
        echo "Git is not installed. Installing Git..."
        sudo apt install -y git
    fi
else
    echo "Skipping Git install check."
fi

# Install PostgreSQL
if [ "$SKIP_INSTALL_CHECK" = false ]; then
    echo "Checking if PostgreSQL is installed..."
    if [ -x "$(command -v psql)" ]; then
        echo "PostgreSQL is already installed."
    else
        echo "PostgreSQL is not installed. Installing PostgreSQL..."
        sudo apt install -y postgresql postgresql-contrib
    fi
else
    echo "Skipping PostgreSQL install check."
fi
echo "Enabling PostgreSQL..."
sudo systemctl enable postgresql

# Install Node.js
if [ "$SKIP_INSTALL_CHECK" = false ]; then
    echo "Checking if Node.js is installed..."
    if [ -x "$(command -v node)" ]; then
        echo "Node.js $(node -v) is already installed."
    else
        echo "Node.js is not installed. Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_23.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
else
    echo "Skipping Node.js install check."
fi

# Install Yarn
if [ "$SKIP_INSTALL_CHECK" = false ]; then
    echo "Checking if Yarn is installed..."
    if [ -x "$(command -v yarn)" ]; then
        echo "Yarn $(yarn -v) is already installed."
    else
        echo "Yarn is not installed. Installing Yarn..."
        npm install -g yarn
    fi
else
    echo "Skipping Yarn install check."
fi

# Install curl
if [ "$SKIP_INSTALL_CHECK" = false ]; then
    echo "Checking if curl is installed..."
    if [ -x "$(command -v curl)" ]; then
        echo "curl is already installed."
    else
        echo "curl is not installed. Installing curl..."
        sudo apt install -y curl
    fi
else
    echo "Skipping curl install check."
fi

# Clean up old services
echo "Removing old services..."
sudo systemctl stop -q riksdagen-db-start
sudo systemctl stop -q riksdagen-yarn-start
sudo systemctl stop -q riksdagen-yarn
sudo systemctl disable -q riksdagen-db-start
sudo systemctl disable -q riksdagen-yarn-start
sudo systemctl disable -q riksdagen-yarn
sudo rm -f /etc/systemd/system/riksdagen-db-start.service
sudo rm -f /etc/systemd/system/riksdagen-yarn-start.service
sudo rm -f /etc/systemd/system/riksdagen-yarn.service
# Install Services
echo "Installing services..."
sudo curl https://raw.githubusercontent.com/Server-Departementet/Riksdagen/refs/heads/main/deploy-code/riksdagen-yarn-start.service -o /etc/systemd/system/riksdagen-yarn-start.service
sudo systemctl daemon-reload
sudo systemctl enable riksdagen-yarn-start
sudo systemctl start riksdagen-yarn-start

# Disable apache2 and nginx since they might be running and we only want tailscale funnel
echo "Trying to stop and disable apache2 and nginx..."
sudo systemctl stop -q apache2
sudo systemctl disable -q apache2
sudo systemctl stop -q nginx
sudo systemctl disable -q nginx

# Tailscale funnel on 3000
echo "Starting Tailscale funnel on port 3000..."
sudo tailscale funnel --bg 3000

# Clone repo
echo "Cloning repo..."
ls /var/www -a
read -p "Overwrite /var/www? (y/n): " OVERWRITE
if [ "$OVERWRITE" = "y" ]; then
    sudo rm -rf /var/www
else
    echo "Exiting..."
    exit 1
fi
sudo git clone https://github.com/Server-Departementet/Riksdagen.git /var/www
cd /var/www

# ENV setup
read -p "ENV. Enter the URL to download the .env file: " ENV_URL
sudo rm -f /var/www/.env
sudo curl $ENV_URL -o /var/www/.env

# Read .env
echo "Reading .env..."
set -a
source /var/www/.env
set +a

# Configure PostgreSQL
echo "Configuring PostgreSQL..."
sudo -i -u postgres psql -c "CREATE USER $POSTGRESQL_USER_NAME WITH PASSWORD '$POSTGRESQL_PASSWORD';"
sudo -i -u postgres psql -c "CREATE DATABASE $POSTGRESQL_DB_NAME;"
sudo -i -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $POSTGRESQL_DB_NAME TO $POSTGRESQL_USER_NAME;"

# Yarn install
sudo yarn install

# Prisma setup
sudo yarn prisma:push
sudo yarn prisma:deploy

# Yarn build
sudo yarn build

# Clean up
cd $START_CWD
echo "Done!"
