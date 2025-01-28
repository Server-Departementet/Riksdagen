
[Service file](../deploy-code/riksdagen-yarn.service).
```bash
sudo nano /etc/systemd/system/riksdagen-yarn.service
```

Start the service
```bash
sudo systemctl daemon-reload
sudo systemctl enable riksdagen-yarn.service
sudo systemctl start riksdagen-yarn.service
```

Debugging 
```bash
sudo systemctl status riksdagen-yarn.service
# and/or
journalctl -u riksdagen-yarn.service
```