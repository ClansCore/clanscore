# 🔐 GitHub Secrets

⚠️ **Hinweis:** Diese Dokumentation ist für automatisiertes Deployment via GitHub Actions gedacht. Da das automatische Deployment aktuell nicht aktiv genutzt wird, verwende stattdessen eine `.env` Datei auf dem Server.

Siehe [Umgebungsvariablen Dokumentation](../../deployment/deployment-stand.md) für die aktuelle Konfiguration mit `.env` Dateien.

---

## Historische Dokumentation (nicht aktiv)

Diese Anleitung listet alle GitHub Secrets auf, die für das automatische Deployment konfiguriert werden müssten (falls aktiviert).

---

## Wo Secrets hinzufügen?

1. Gehe zu deinem GitHub Repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Klicke auf **New repository secret**
4. Füge jedes Secret einzeln hinzu

---

## Erforderliche Secrets

### 🔌 Server-Verbindung (SSH)

Diese Secrets sind **erforderlich** für das SSH-Deployment:

| Secret Name | Beschreibung | Beispiel | Erforderlich |
|------------|--------------|----------|--------------|
| `SERVER_HOST` | IP-Adresse oder Hostname des Servers | `<benutzer@host>` oder `<server_ip>` | ✅ Ja |
| `SERVER_SSH_KEY` | Privater SSH-Key (kompletter Inhalt) | Siehe unten | ⚠️ Option 1 |
| `SERVER_SSH_PASSWORD` | SSH-Passwort | Ihr Passwort | ⚠️ Option 2 |
| `SERVER_SSH_PORT` | SSH-Port (optional, Standard: 22) | `22` | ❌ Nein |
| `SERVER_USER` | SSH-Benutzername | `ins`, `ubuntu`, `root`, `deploy` | ✅ Ja |

**Hinweis:** du kannst entweder `SERVER_SSH_KEY` (Key-basiert) ODER `SERVER_SSH_PASSWORD` (Passwort-basiert) verwenden. Key-basiert ist sicherer und empfohlen.

**SSH-Key erstellen (Option 1 - Empfohlen):**
```bash
# Lokal ausführen
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Privaten Key anzeigen (für SERVER_SSH_KEY)
cat ~/.ssh/github_actions_deploy

# Öffentlichen Key auf Server installieren
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub <Benutzer>@<server_ip>
```

**Passwort-Authentifizierung (Option 2):**
- Verwende `SERVER_SSH_PASSWORD` statt `SERVER_SSH_KEY`
- Siehe [SSH Setup](../ssh-setup.md) für Details

### 🗄️ MongoDB Konfiguration

| Secret Name | Beschreibung | Beispiel | Erforderlich |
|------------|--------------|----------|--------------|
| `MONGO_DB` | Datenbankname | `clanscore` | ❌ Nein (Standard: clanscore) |
| `MONGO_INITDB_ROOT_PASSWORD` | MongoDB Admin-Passwort | `sicheres_passwort_123` | ✅ Ja |
| `MONGO_INITDB_ROOT_USERNAME` | MongoDB Admin-Benutzername | `admin` | ✅ Ja |

### 🤖 Discord Bot Konfiguration

| Secret Name | Beschreibung | Beispiel | Erforderlich |
|------------|--------------|----------|--------------|
| `DISCORD_CLIENT_ID` | Discord Client ID | `123456789012345678` | ✅ Ja |
| `DISCORD_GUILD_ID` | Discord Server (Guild) ID | `987654321098765432` | ✅ Ja |
| `DISCORD_TOKEN` | Discord Bot Token | `MTIzNDU2Nzg5MDEyMzQ1Njc4OQ...` | ✅ Ja |
| `DISCORD_SERVER_PORT` | Port für Bot Webhook Server | `3001` | ❌ Nein (Standard: 3001) |

**Wo finde ich diese Werte?**
- Discord Developer Portal: https://discord.com/developers/applications
- Bot Token: Application → Bot → Token
- Client ID: Application → General Information → Application ID
- Guild ID: Rechtsklick auf Discord-Server → "Server-ID kopieren"

### 🔗 Webhook Konfiguration

| Secret Name | Beschreibung | Beispiel | Erforderlich |
|------------|--------------|----------|--------------|
| `WEBHOOK_SHARED_SECRET` | Geheimer Schlüssel für Webhooks | `mein_geheimer_schlüssel_123` | ✅ Ja |
| `DISCORD_BOT_WEBHOOK_URL` | URL für Bot Webhooks | `http://<server_ip>:3001` | ✅ Ja |

### 📅 Google Calendar OAuth

| Secret Name | Beschreibung | Beispiel | Erforderlich |
|------------|--------------|----------|--------------|
| `GOOGLE_CALENDAR_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` | ✅ Ja |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxx...` | ✅ Ja |
| `GOOGLE_CALENDAR_REDIRECT_URI` | OAuth Redirect URI | `http://<server_ip>/calendarToken` | ✅ Ja |

**Wo finde ich diese Werte?**
- Google Cloud Console: https://console.cloud.google.com/
- APIs & Services → Credentials → OAuth 2.0 Client IDs
- Redirect URI muss exakt übereinstimmen!

### 🔐 API Konfiguration

| Secret Name | Beschreibung | Beispiel | Erforderlich |
|------------|--------------|----------|--------------|
| `CLANSCORE_API_URL` | API Base URL | `http://<server_ip>:3000/api` | ✅ Ja |
| `CLANSCORE_API_KEY` | API Key für Authentifizierung | `mein_api_key_123` | ✅ Ja |
| `JWT_SECRET` | Secret für JWT Token Signierung | `mein_jwt_secret_456` | ✅ Ja |

### 🎨 Dashboard Konfiguration

| Secret Name | Beschreibung | Beispiel | Erforderlich |
|------------|--------------|----------|--------------|
| `DASHBOARD_API_URL` | API URL für Dashboard | `http://<server_ip>:3000/api` | ✅ Ja |
| `CORS_ORIGIN` | CORS Origin für API | `http://<server_ip>` | ✅ Ja |

**Für Domain (falls konfiguriert):**
- `DASHBOARD_API_URL`: `https://clanscore.ost.ch/api`
- `CORS_ORIGIN`: `https://clanscore.ost.ch`

---

## Schnellstart-Checkliste

### Schritt 1: SSH-Key erstellen

- SSH-Key lokal erstellen
- Öffentlichen Key auf Server installieren
- Privaten Key kopieren (für `SERVER_SSH_KEY`)

### Schritt 2: GitHub Secrets hinzufügen

**Server-Verbindung:**

- `SERVER_HOST` = `<benutzer@host>` oder `<server_ip>`
- `SERVER_USER` = Ihr SSH-Benutzername
- `SERVER_SSH_KEY` = Privater SSH-Key (Option 1)
- `SERVER_SSH_PASSWORD` = SSH-Password (Option 2)
- `SERVER_SSH_PORT` = `22` (falls Standard)

**MongoDB:**

- `MONGO_INITDB_ROOT_USERNAME` = `admin`
- `MONGO_INITDB_ROOT_PASSWORD` = Sicheres Passwort
- `MONGO_DB` = `clanscore` (optional)

**Discord:**

- `DISCORD_TOKEN` = Bot Token
- `DISCORD_CLIENT_ID` = Client ID
- `DISCORD_GUILD_ID` = Server ID
- `DISCORD_SERVER_PORT` = `3001` (optional)

**Webhooks:**

- `WEBHOOK_SHARED_SECRET` = Geheimer Schlüssel
- `DISCORD_BOT_WEBHOOK_URL` = `http://<server_ip>:3001`

**Google Calendar:**

- `GOOGLE_CALENDAR_CLIENT_ID` = Client ID
- `GOOGLE_CALENDAR_CLIENT_SECRET` = Client Secret
- `GOOGLE_CALENDAR_REDIRECT_URI` = `http://<server_ip>/calendarToken`

**API:**

- `CLANSCORE_API_URL` = `http://<server_ip>:3000/api`
- `CLANSCORE_API_KEY` = API Key
- `JWT_SECRET` = JWT Secret

**Dashboard:**

- `DASHBOARD_API_URL` = `http://<server_ip>:3000/api`
- `CORS_ORIGIN` = `http://<server_ip>`

### Schritt 3: Workflow testen

- GitHub → Actions → Deploy to Server
- "Run workflow" klicken
- Logs prüfen

---

## Beispiel-Konfiguration für srbsci-11.ost.ch

```yaml
# Server-Verbindung
SERVER_HOST: srbsci-11.ost.ch
SERVER_USER: ubuntu
SERVER_SSH_KEY: |
  -----BEGIN OPENSSH PRIVATE KEY-----
  b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAACFwAAAAdzc2gtcn
  ...
  -----END OPENSSH PRIVATE KEY-----
SERVER_SSH_PORT: 22

# MongoDB
MONGO_INITDB_ROOT_USERNAME: admin
MONGO_INITDB_ROOT_PASSWORD: IhrSicheresPasswort123!
MONGO_DB: clanscore

# Discord
DISCORD_TOKEN: IhrDiscordBotToken
DISCORD_CLIENT_ID: 123456789012345678
DISCORD_GUILD_ID: 987654321098765432
DISCORD_SERVER_PORT: 3001

# Webhooks
WEBHOOK_SHARED_SECRET: IhrWebhookSecret123
DISCORD_BOT_WEBHOOK_URL: http://<server_ip>:3001

# Google Calendar
GOOGLE_CALENDAR_CLIENT_ID: xxx.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET: GOCSPX-xxx...
GOOGLE_CALENDAR_REDIRECT_URI: http://<server_ip>/calendarToken

# API
CLANSCORE_API_URL: http://<server_ip>:3000/api
CLANSCORE_API_KEY: IhrApiKey123
JWT_SECRET: IhrJwtSecret456

# Dashboard
DASHBOARD_API_URL: http://<server_ip>:3000/api
CORS_ORIGIN: http://<server_ip>
```

---

## Wichtige Hinweise

### 🔒 Sicherheit

- **Niemals** Secrets im Code committen
- Verwende **starke, eindeutige Passwörter**
- **Rotiere Secrets regelmässig**
- **Beschränke Zugriff** auf Secrets (Repository Settings)

### 🔄 Secret-Rotation

Wenn du ein Secret ändern musst:

1. Gehe zu Settings → Secrets
2. Klicke auf das Secret
3. Klicke auf "Update"
4. Neuen Wert eingeben
5. Workflow erneut ausführen

### 🧪 Testing

Nach dem Hinzufügen aller Secrets:

1. Gehe zu **Actions**
2. Wähle **Deploy to Server**
3. Klicke auf **Run workflow**
4. Prüfe die Logs auf Fehler

### ❌ Häufige Fehler

**"Permission denied (publickey)"**

- Prüfe `SERVER_SSH_KEY` (muss kompletter privater Key sein)
- Prüfe, ob öffentlicher Key auf Server installiert ist

**"Connection refused"**

- Prüfe `SERVER_HOST` und `SERVER_SSH_PORT`
- Prüfe Firewall-Einstellungen

**"Missing environment variables"**

- Prüfe, ob alle erforderlichen Secrets hinzugefügt wurden
- Prüfe die Schreibweise der Secret-Namen

---

## Hilfe

Bei Problemen:

1. Prüfe die Workflow-Logs in GitHub Actions
2. Prüfe die Server-Logs: `docker-compose logs`
3. Siehe [Deployment Guide](../../deployment/guide.md) für Troubleshooting

---
