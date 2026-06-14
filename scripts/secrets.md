## Secret data needed

Main two files needed in `scripts/` are:
- `scripts/user-aliases.json`
- `scripts/usermap.json`

### user-aliases.json
  
Only source of names for users.

```json
{
  "DISCORD_USER_ID_1:": ["ALIAS1", "ALIAS2"],
  "DISCORD_USER_ID_2:": ["ALIAS1"],
  ...
}
```

### usermap.json

Used to link discord users to clerk.

```json
[
  {
    "debugName": "only shows up in logs, helps debugging",
    "discordId": "",
    "clerkProd": "",
    "clerkDev": ""
  },
  ...
]
```