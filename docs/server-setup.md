# Server setup

1. Run [install script](../deploy-code/install.sh) on the server.
```bash
sudo apt install -y curl
sudo curl -sSL https://raw.githubusercontent.com/Server-Departementet/Riksdagen/refs/heads/main/deploy-code/install.sh | bash
```

2. Set up the env file. See [env file](./.env-setup.md).

<!-- 
Debugging 
```bash
sudo systemctl status riksdagen-yarn-start.service
sudo systemctl status riksdagen-db-start.service

# and/or

journalctl -u riksdagen-yarn-start.service
journalctl -u riksdagen-db-start.service
``` -->