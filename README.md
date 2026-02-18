# ClansCore

Monorepo für ein Vereinsmanagement-System mit API, Discord-Bot und Dashboard.

## Projektstruktur

- **clanscore-api**: Node.js/Express REST API
- **discord-bot**: Discord Bot für Vereinsmanagement
- **dashboard**: Angular Frontend
- **shared**: Gemeinsame TypeScript-Pakete

## Setup

```bash
npm run bootstrap
```

## Build

```bash
# Alle Komponenten bauen
npm run build:all

# Einzelne Komponenten
npm run build:shared
npm run build:api
npm run build:bot
npm run build:dashboard
```

## Start

```bash
# Production
npm run start:api
npm run start:bot
npm run start:dashboard

# Development
npm run dev:api
npm run dev:bot
npm run dev:dashboard
```

## Dokumentation

```bash
npm run docs:build  # Dokumentation bauen
npm run docs:serve  # Lokale Vorschau
```

## Docker

- `docker-compose.yml`: Production-Setup mit MongoDB

## Umgebungsvariablen (.env)

Erstelle eine `.env` Datei im Root-Verzeichnis mit folgenden Variablen:

```env
# MongoDB Konfiguration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your-secure-password-here
MONGO_DB=clanscore

# Discord Bot Konfiguration
DISCORD_TOKEN=your-discord-bot-token-here
DISCORD_CLIENT_ID=your-discord-client-id-here
DISCORD_GUILD_ID=your-discord-guild-id-here
DISCORD_SERVER_PORT=3001

# Webhook Konfiguration
WEBHOOK_SHARED_SECRET=your-webhook-shared-secret-here
DISCORD_BOT_WEBHOOK_URL=http://discord-bot:3001

# Google Calendar OAuth (Optional)
GOOGLE_CALENDAR_CLIENT_ID=your-google-calendar-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-google-calendar-client-secret
GOOGLE_CALENDAR_REDIRECT_URI=http://your-domain.com/calendarToken

# API Konfiguration
CLANSCORE_API_URL=http://clanscore-api:3000/api
CLANSCORE_API_KEY=your-api-key-here
CLANSCORE_ADMIN_PW=your-admin-password-here
JWT_SECRET=your-jwt-secret-here
CORS_ORIGIN=http://localhost,http://localhost:4200,http://152.96.10.11,http://srbsci-11.ost.ch
```

**Wichtig:** Die `.env` Datei enthält sensible Daten und sollte niemals ins Git Repository committet werden!
