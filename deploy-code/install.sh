# !/bin/bash

# Tailscale installation
echo "Installing Tailscale..."
read -p "Please provide your generated Tailscale Linux server install script: " tailscale_script
sudo bash $tailscale_script
if [ $? -ne 0 ]; then
    echo "Tailscale installation failed. Exiting..."
    exit 1
fi

# Git installation
echo "Checking if Git is installed..."
if [ -x "$(command -v git)" ]; then
    echo "Git is already installed."
else
    echo "Git is not installed. Installing Git..."
    sudo apt install -y git
fi

# PostgreSQL installation
echo "Checking if PostgreSQL is installed..."
if [ -x "$(command -v psql)" ]; then
    echo "PostgreSQL is already installed."
else
    echo "PostgreSQL is not installed. Installing PostgreSQL..."
    sudo apt install -y postgresql-common
    sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
fi

# Node.js installation > 20.x
echo "Checking if Node.js (>20.x) is installed..."
if [ -x "$(command -v node)" ] && [ "$(node -v | cut -d. -f1 | cut -c 2-)" -ge 20 ]; then
    echo "Node.js $(node -v) is already installed."
else
    echo "Node.js is not installed. Installing Node.js..."
    # Add NodeSource repository and install Node.js
    curl -fsSL https://deb.nodesource.com/setup_23.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Yarn installation
echo "Checking if Yarn is installed..."
if [ -x "$(command -v yarn)" ]; then
    echo "Yarn is already installed."
else
    echo "Yarn is not installed. Installing Yarn..."
    # Install yarn via npm
    sudo npm install -g yarn
fi

# Clone the repository
echo "Preparing to clone the repository..."
# Check if the directory exists
if [ -d "/var/www" ]; then
    echo "The directory '/var/www' already exists."
    read -p "Do you want to delete the directory '/var/www' and clone the repository? (yes/no) " delete
    if [ "$delete" = "yes" ]; then
        sudo rm -rf /var/www
    elif [ "$delete" = "no" ]; then
        echo "Repository cloning aborted. Exiting..."
        exit 1
    else
        echo "Please enter yes/no. Repository cloning aborted. Exiting..."
        exit 1
    fi
fi
echo "Cloning the repository..."
sudo git clone https://github.com/Server-Departementet/Riksdagen.git /var/www 
cd /var/www
# Install dependencies
sudo yarn install

# Database setup
# Set up the database. Confirm with 'yes' when prompted due to possible data loss.
echo "Setting up the database..."
read -p "This will reset the database. Are you sure you want to continue? (yes/no) " confirm
if [ "$confirm" = "yes" ]; then
    sudo yarn db:reset
elif [ "$confirm" = "no" ]; then
    echo "Database setup aborted."
else
    echo "Please enter yes/no. Database setup aborted."
fi

# Add services to systemd
echo "Adding services to systemd..."
# Download the service files
sudo curl https://raw.githubusercontent.com/Server-Departementet/Riksdagen/refs/heads/main/deploy-code/riksdagen-yarn-start.service -o riksdagen-yarn-start.service
sudo curl https://raw.githubusercontent.com/Server-Departementet/Riksdagen/refs/heads/main/deploy-code/riksdagen-db-start.service -o riksdagen-db-start.service
# Force move to overwrite existing files
sudo mv riksdagen-yarn-start.service /etc/systemd/system/riksdagen-yarn-start.service -f
sudo mv riksdagen-db-start.service /etc/systemd/system/riksdagen-db-start.service -f
# Reload systemd
sudo systemctl daemon-reload
sudo systemctl enable riksdagen-yarn-start
sudo systemctl enable riksdagen-db-start
sudo systemctl start riksdagen-yarn-start
sudo systemctl start riksdagen-db-start

# Reboot
echo "Rebooting the system. Please wait..."
sudo systemctl reboot
