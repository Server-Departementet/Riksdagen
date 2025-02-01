# Server setup

1. Run [install script](../deploy-code/install.sh) on the server.
```bash
sudo apt install -y curl # In case curl isn't installed
sudo curl -sSL https://raw.githubusercontent.com/Server-Departementet/Riksdagen/refs/heads/main/deploy-code/install.sh -o riksdagen-install.sh && sudo bash -i riksdagen-install.sh && sudo rm -f riksdagen-install.sh && sudo reboot
```

2. Set up the env file. See [env file](./.env-setup.md).

Debugging the service files on the server:
```bash
sudo systemctl status riksdagen-yarn-start.service
sudo systemctl status riksdagen-db-start.service

# and/or

journalctl -u riksdagen-yarn-start.service
journalctl -u riksdagen-db-start.service
```