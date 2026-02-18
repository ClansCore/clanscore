# 📋 Secrets CheatSheet

Hier sind alle Secrets auf einen Blick:

| Erforderlich (Muss vorhanden sein) | Optional (Haben Standardwerte) |
| ---------------------------------- | ------------------------------ |
| SERVER_HOST | SERVER_SSH_PORT (Standard: 22) |
| SERVER_USER | MONGO_DB (Standard: clanscore) |
| SERVER_SSH_KEY | DISCORD_SERVER_PORT (Standard: 3001) |
| SERVER_SSH_PASSWORD |  |
| MONGO_INITDB_ROOT_PASSWORD |  |
| MONGO_INITDB_ROOT_USERNAME |  |
| DISCORD_TOKEN |  |
| DISCORD_CLIENT_ID |  |
| DISCORD_GUILD_ID |  |
| WEBHOOK_SHARED_SECRET |  |
| DISCORD_BOT_WEBHOOK_URL |  |
| GOOGLE_CALENDAR_CLIENT_ID |  |
| GOOGLE_CALENDAR_CLIENT_SECRET |  |
| GOOGLE_CALENDAR_REDIRECT_URI |  |
| CLANSCORE_API_URL |  |
| CLANSCORE_API_KEY |  |
| JWT_SECRET |  |
| DASHBOARD_API_URL |  |
| CORS_ORIGIN |  |
| PUBLIC_REPO_DEPLOY_TOKEN |  |

---

## Secrets Copy-Paste Liste

Füge diese Secrets entweder direkt als Umgebungs-Variablen in die `.env` Datei oder als GitHub Secrets hinzu (Settings → Secrets → Actions).

```
# -- SERVER --
SERVER_HOST=<server_host>
SERVER_USER=<server_benutzer>
SERVER_SSH_KEY=<privater_ssh_key>  # ODER
SERVER_SSH_PASSWORD=<ssh_passwort>  # Alternative zu KEY
SERVER_SSH_PORT=22 # Optional

# -- MONGODB --
MONGO_DB=clanscore # Optional
MONGO_INITDB_ROOT_PASSWORD=<db_passwort>
MONGO_INITDB_ROOT_USERNAME=admin

# -- DISCORD-BOT --
DISCORD_TOKEN=<discord_token>
DISCORD_CLIENT_ID=<discord_client_id>
DISCORD_GUILD_ID=<discord_guild_id>
DISCORD_SERVER_PORT=3001 # Optional

# -- WEBHOOK --
WEBHOOK_SHARED_SECRET=<webhook_secret>
DISCORD_BOT_WEBHOOK_URL=http://<server_ip>:3001

# -- GOOGLE CALENDAR --
GOOGLE_CALENDAR_CLIENT_ID=<Ihr Client ID>
GOOGLE_CALENDAR_CLIENT_SECRET=<google_secret>
GOOGLE_CALENDAR_REDIRECT_URI=http://<server_ip>/calendarToken

# -- BACKEND-API --
CLANSCORE_API_URL=http://<server_ip>:3000/api
CLANSCORE_API_KEY=<api_key>
JWT_SECRET=<jwt_secret>

# -- DASHBOARD --
DASHBOARD_API_URL=http://<server_ip>:3000/api
CORS_ORIGIN=http://<server_ip>

# -- DOC DEPLOYMENT --
PUBLIC_REPO_DEPLOY_TOKEN=<github_ssh_key>
```

---

## Anzahl der Secrets

- **Erforderlich**: 20 Secrets
- **Optional**: 3 Secrets
- **Gesamt**: 23 Secrets

Siehe [GitHub Secrets Guide](../secrets-env/github-secrets.md) für detaillierte Beschreibungen.

---
