# 🔧 Lokales Docker Troubleshooting

## Bekannte Probleme und Lösungen

### 1. "404 Not Found - @clanscore/shared"

**Problem:** Das lokale Workspace-Package wird nicht gefunden.

**Lösung:** ✅ Behoben
- Dockerfiles verwenden jetzt Root als Build-Kontext
- `shared` Package wird zuerst gebaut
- Siehe aktualisierte Dockerfiles

### 2. "Cannot find module 'discord.js'"

**Problem:** `discord.js` fehlt in API Dependencies.

**Lösung:** ✅ Behoben
- `discord.js` wurde zu `apps/clanscore-api/package.json` hinzugefügt
- Installiert mit: `npm install discord.js@^14.25.1 -w clanscore-api`

### 3. "nginx.conf not found"

**Problem:** Pfad zu `nginx.conf` ist falsch nach Build-Kontext-Änderung.

**Lösung:** ✅ Behoben
- Pfad geändert von `COPY nginx.conf` zu `COPY apps/dashboard/nginx.conf`

### 4. "lmdb gyp ERR! not ok"

**Problem:** Native Dependencies benötigen Build-Tools.

**Lösung:** ✅ Behoben
- Build-Tools zu Dashboard Dockerfile hinzugefügt:
  ```dockerfile
  RUN apk add --no-cache python3 make g++
  ```

### 5. Umgebungs-Variablen Warnungen

**Problem:** Docker Compose zeigt Warnungen über fehlende Variablen.

**Lösung:**
- Für lokale Tests: `.env` Datei erstellen
- Für Production: GitHub Secrets verwenden (keine Warnungen)

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

## Build-Befehle

### Alle Services bauen
```bash
docker-compose build
```

### Einzelner Service
```bash
docker-compose build clanscore-api
docker-compose build discord-bot
docker-compose build dashboard
```

### Mit Cache löschen
```bash
docker-compose build --no-cache
```

## Services starten

### Alle Services
```bash
docker-compose up -d
```

### Mit Logs
```bash
docker-compose up
```

### Einzelner Service
```bash
docker-compose up clanscore-api
```

## Status prüfen

```bash
# Container-Status
docker-compose ps

# Logs
docker-compose logs -f

# Einzelner Service
docker-compose logs -f clanscore-api
```

## Cleanup

```bash
# Services stoppen
docker-compose down

# Services stoppen und Volumes löschen
docker-compose down -v

# Alte Images löschen
docker system prune -a
```

## Nächste Schritte

Nach erfolgreichem lokalen Build:
1. ✅ Code committen
2. ✅ GitHub Secrets konfigurieren
3. ✅ Production Deployment testen

Siehe [Lokale Entwicklung](local.md) für lokale Entwicklung ohne Docker.

