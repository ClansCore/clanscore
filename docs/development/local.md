# 💻 Lokale Entwicklung

Diese Anleitung beschreibt, wie du die Anwendungen lokal für Entwicklung und Tests starten kannst.

---

## Übersicht

Für lokale Entwicklung verwendest du **`.env` Dateien**. Diese sind nur für lokale Tests gedacht und sollten **nie** auf dem Server oder im Repository committed werden.

---

## Voraussetzungen

- Node.js 20+ installiert
- MongoDB lokal installiert (oder Docker)
- Git Repository geklont

---

## Setup

### 1. Dependencies installieren

```bash
# Im Root-Verzeichnis
npm install

# Shared Package bauen
npm run build:shared
```

### 2. Umgebungs-Variablen konfigurieren

```bash
# .env Datei erstellen (nur für lokale Entwicklung!)
cp .env.example .env
nano .env  # oder vim/vi
```

**Wichtigste Variablen für lokale Entwicklung:**

```env
# MongoDB (lokal)
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DB=clanscore
# MONGO_INITDB_ROOT_USERNAME=  # Optional für lokale DB
# MONGO_INITDB_ROOT_PASSWORD=  # Optional für lokale DB

# Discord Bot
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_discord_guild_id
DISCORD_SERVER_PORT=3001

# Webhooks
WEBHOOK_SHARED_SECRET=local_dev_secret
DISCORD_BOT_WEBHOOK_URL=http://localhost:3001

# Google Calendar
GOOGLE_CALENDAR_CLIENT_ID=your_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/calendarToken

# API
CLANSCORE_API_URL=http://localhost:3000/api
CLANSCORE_API_KEY=local_dev_key
JWT_SECRET=local_dev_jwt_secret
CORS_ORIGIN=http://localhost:4200

# Dashboard
DASHBOARD_API_URL=http://localhost:3000/api
```

### 3. Services starten

#### Option A: Alle Services einzeln

```bash
# Terminal 1: API
cd apps/clanscore-api
npm run dev

# Terminal 2: Discord Bot
cd apps/discord-bot
npm run dev

# Terminal 3: Dashboard
cd apps/dashboard
npm start
```

#### Option B: Mit Docker Compose (lokal)

```bash
# Im Root-Verzeichnis
docker-compose up
```

### 4. Zugriff

- **API**: http://localhost:3000/api
- **Dashboard**: http://localhost:4200
- **Health Check**: http://localhost:3000/health

## Unterschiede zu Production

| Aspekt | Lokale Entwicklung | Production |
|--------|-------------------|------------|
| **Secrets** | `.env` Dateien | GitHub Secrets |
| **MongoDB** | `localhost:27017` | Docker Container `mongodb:27017` |
| **API URL** | `http://localhost:3000/api` | `http://your-server:3000/api` |
| **CORS** | `http://localhost:4200` | Ihre Domain |
| **Deployment** | Manuell (`npm run dev`) | Automatisch (GitHub Actions) |

## Wichtige Hinweise

### ⚠️ Sicherheit

- **Niemals** `.env` Dateien committen
- `.env` ist bereits in `.gitignore`
- Verwende `.env.example` als Template
- Für Production: **Immer** GitHub Secrets verwenden

### 🔄 Workflow

1. **Lokal entwickeln** mit `.env`
2. **Testen** lokal
3. **Commiten** (ohne `.env`)
4. **GitHub Actions** deployt automatisch mit Secrets

### 🐛 Troubleshooting

**"Missing environment variables"**
- Prüfe, ob `.env` Datei existiert
- Prüfe, ob alle Variablen gesetzt sind

**MongoDB-Verbindungsfehler**
- Prüfe, ob MongoDB läuft: `mongosh` oder `docker ps`
- Prüfe `MONGO_HOST` und `MONGO_PORT`

**CORS-Fehler**
- Prüfe `CORS_ORIGIN` in `.env`
- Sollte `http://localhost:4200` sein für lokale Entwicklung

## Nächste Schritte

Nach lokaler Entwicklung:
1. Code committen (ohne `.env`)
2. GitHub Actions deployt automatisch mit Secrets
3. Production verwendet GitHub Secrets, nicht `.env`

Siehe [Deployment Guide](../deployment/guide.md) für Production-Deployment.

