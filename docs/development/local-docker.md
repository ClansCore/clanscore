# 🐳 Lokales Docker Setup

## Problem

Das `@clanscore/shared` Package ist ein lokales Workspace-Package und muss beim Docker-Build verfügbar sein.

## Lösung

Die Dockerfiles wurden angepasst, um:
1. Den Build-Kontext auf das Root-Verzeichnis zu setzen
2. Das `shared` Package zuerst zu bauen
3. Dann die Apps mit dem gebauten Package zu bauen

## Lokales Testen

### 1. .env Datei erstellen (für lokale Tests)

```bash
# Im Root-Verzeichnis
cp .env.example .env
nano .env
```

**Minimale .env für lokale Tests:**
```env
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=test123
MONGO_DB=clanscore
DISCORD_TOKEN=your_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_guild_id
DISCORD_SERVER_PORT=3001
WEBHOOK_SHARED_SECRET=test_secret
DISCORD_BOT_WEBHOOK_URL=http://localhost:3001
GOOGLE_CALENDAR_CLIENT_ID=your_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_secret
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/calendarToken
CLANSCORE_API_URL=http://localhost:3000/api
CLANSCORE_API_KEY=test_key
JWT_SECRET=test_jwt_secret
CORS_ORIGIN=http://localhost:4200
DASHBOARD_API_URL=http://localhost:3000/api
```

### 2. Docker Build testen

```bash
# Alle Services bauen
docker-compose build

# Oder einzeln
docker-compose build clanscore-api
docker-compose build discord-bot
docker-compose build dashboard
```

### 3. Services starten

```bash
# Alle Services
docker-compose up -d

# Mit Logs
docker-compose up

# Einzelner Service
docker-compose up clanscore-api
```

## Troubleshooting

### "404 Not Found - @clanscore/shared"

**Problem:** Das shared Package wird nicht gefunden.

**Lösung:**
1. Prüfe, ob der Build-Kontext auf Root gesetzt ist (in `docker-compose.yml`)
2. Prüfe, ob `shared/package.json` kopiert wird
3. Prüfe, ob `npm install` im Root-Verzeichnis ausgeführt wird

### "Cannot find module '@clanscore/shared'"

**Problem:** Das Package ist nicht gebaut.

**Lösung:**
1. Stelle sicher, dass `shared` zuerst gebaut wird
2. Prüfe, ob `shared/dist` existiert nach dem Build

### Build dauert sehr lange

**Lösung:**
- Verwende Docker Build Cache
- Baue nur geänderte Services: `docker-compose build clanscore-api`

## Unterschiede zu Production

| Aspekt | Lokal | Production |
|--------|-------|------------|
| **.env** | ✅ Verwendet | ❌ GitHub Secrets |
| **Build-Kontext** | Root-Verzeichnis | Root-Verzeichnis |
| **Shared Package** | Wird gebaut | Wird gebaut |
| **MongoDB** | Docker Container | Docker Container |

## Nächste Schritte

Nach erfolgreichem lokalen Build:
1. ✅ Code committen
2. ✅ GitHub Secrets konfigurieren
3. ✅ GitHub Actions deployt automatisch

