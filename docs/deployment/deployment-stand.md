# 🚀 Deployment-Stand - Detaillierte Dokumentation

Diese Dokumentation beschreibt den aktuellen Stand des Deployment-Systems für das ClansCore-Projekt. Die Dokumentation umfasst alle Aspekte des Deployments, von der Architektur bis hin zu den einzelnen Konfigurationsdetails.

---

## Übersicht

### System-Komponenten

Das ClansCore-System besteht aus folgenden Hauptkomponenten:

| Komponente | Technologie | Port | Container-Name |
|------------|--------------|------|----------------|
| **clanscore-api** | Node.js/Express/TypeScript | 3000 (intern) | `clanscore-api` |
| **dashboard** | Angular/TypeScript + Nginx | 80 (extern) | `clanscore-dashboard` |
| **discord-bot** | Node.js/Discord.js/TypeScript | 3001 (extern) | `clanscore-discord-bot` |
| **mongodb** | MongoDB 8 | 27017 (intern) | `clanscore-mongodb` |

### Deployment-Stack

- **Container-Orchestrierung**: Docker Compose
- **Container-Runtime**: Docker 20.10+
- **Build-System**: Multi-Stage Docker Builds
- **Reverse Proxy**: Nginx (im Dashboard-Container integriert)
- **Package Management**: npm Workspaces

### Aktueller Deployment-Status

- ✅ **Docker Compose Setup**: Vollständig konfiguriert
- ✅ **Multi-Stage Builds**: Implementiert für alle Services
- ✅ **Health Checks**: Konfiguriert für alle Services
- ✅ **Netzwerk-Isolation**: Bridge-Netzwerk implementiert
- ✅ **Deployment-Skripte**: Bash und PowerShell verfügbar
- ✅ **Backup-System**: Docker-Container für Backups vorhanden

---

## Deployment-Architektur

### High-Level-Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                    Externe Zugriffe                         │
│  - Browser (Dashboard)                                      │
│  - Discord API (Bot)                                         │
│  - Google Calendar API (OAuth)                               │
└──────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Docker Host                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           clanscore-network (Bridge)                │  │
│  │                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │  │
│  │  │   Dashboard  │  │ clanscore-api│  │discord-bot │ │  │
│  │  │  (Nginx)     │  │  (Express)   │  │(Discord.js)│ │  │
│  │  │  Port: 80    │  │  Port: 3000  │  │ Port: 3001 │ │  │
│  │  └──────┬───────┘  └──────┬───────┘  └─────┬───────┘ │  │
│  │         │                 │                 │         │  │
│  │         │                 │                 │         │  │
│  │         └─────────────────┴─────────────────┘         │  │
│  │                         │                             │  │
│  │                         ▼                             │  │
│  │                  ┌──────────────┐                    │  │
│  │                  │   MongoDB     │                    │  │
│  │                  │   Port: 27017 │                    │  │
│  │                  └──────────────┘                    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Docker Volumes                         │  │
│  │  - mongo_data (persistente Datenbank)              │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Service-Abhängigkeiten

```
mongodb (Health Check)
    │
    ├──► clanscore-api (depends_on: mongodb)
    │         │
    │         ├──► dashboard (depends_on: clanscore-api)
    │         │
    │         └──► discord-bot (depends_on: clanscore-api, mongodb)
```

### Kommunikations-Flows

1. **Browser → Dashboard → API**
   - Browser sendet Request an Dashboard (Port 80)
   - Dashboard (Nginx) leitet `/api/*` Requests an `clanscore-api:3000` weiter
   - Dashboard serviert statische Angular-Assets

2. **API → Discord Bot (Webhooks)**
   - API sendet HTTP POST an `discord-bot:3001/api/notifications/*`
   - Authentifizierung via `x-webhook-token` Header

3. **Discord Bot → API (REST)**
   - Bot sendet HTTP Requests an `clanscore-api:3000/api/*`
   - Authentifizierung via `x-api-key` Header

4. **Alle Services → MongoDB**
   - Verbindung über Docker DNS: `mongodb:27017`
   - Authentifizierung via `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD`

---

## Docker-Konfiguration

### Docker Compose Konfiguration

Das Projekt verwendet `docker-compose.yml` für das Deployment:

**Zweck**: Standard-Deployment mit lokalen Builds

**Features**:
- Baut alle Images lokal
- Verwendet `.env` Datei für Konfiguration
- Port-Mappings:
  - Dashboard: `80:80` (extern)
  - API: `127.0.0.1:3000:3000` (nur localhost)
  - Discord Bot: `3001:3001` (extern)
  - MongoDB: `27017:27017` (extern)

**Verwendung**:
```bash
docker-compose up -d --build
```

### Docker Netzwerk

**Netzwerk-Name**: `clanscore-network`

**Typ**: Bridge (Standard)

**Services im Netzwerk**:
- `mongodb`
- `clanscore-api`
- `discord-bot`
- `dashboard`

**Service Discovery**: Docker DNS ermöglicht Kommunikation über Service-Namen:
- `mongodb` → `mongodb:27017`
- `clanscore-api` → `clanscore-api:3000`
- `discord-bot` → `discord-bot:3001`

### Docker Volumes

**Volume-Name**: `mongo_data`

**Typ**: Local Driver

**Zweck**: Persistente Speicherung der MongoDB-Daten

**Mount-Point**: `/data/db` (im Container)

**Backup-Strategie**: Siehe [Backup-Strategien](#backup-strategien)

---

## Service-Details

### 1. clanscore-api

#### Dockerfile-Struktur

**Multi-Stage Build**:
1. **Builder Stage** (node:20-alpine):
   - Installiert Dependencies
   - Baut `shared` Package
   - Baut `clanscore-api` Application

2. **Production Stage** (node:20-alpine):
   - Kopiert nur Production Dependencies
   - Kopiert Build-Artefakte
   - Startet Server mit `node dist/index.js`

#### Konfiguration

**Port**: 3000 (intern, nur localhost von aussen erreichbar)

**Health Check**:
```yaml
test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health || exit 1"]
interval: 30s
timeout: 10s
retries: 3
```

**Umgebungsvariablen**:
- `NODE_ENV=production`
- `MONGO_HOST=mongodb`
- `MONGO_PORT=27017`
- `MONGO_DB` (aus `.env`)
- `MONGO_INITDB_ROOT_USERNAME` (aus `.env`)
- `MONGO_INITDB_ROOT_PASSWORD` (aus `.env`)
- `DISCORD_TOKEN` (aus `.env`)
- `DISCORD_CLIENT_ID` (aus `.env`)
- `DISCORD_GUILD_ID` (aus `.env`)
- `DISCORD_SERVER_PORT` (aus `.env`, Default: 3001)
- `DISCORD_BOT_WEBHOOK_URL` (aus `.env`, Default: `http://discord-bot:3001`)
- `WEBHOOK_SHARED_SECRET` (aus `.env`)
- `GOOGLE_CALENDAR_CLIENT_ID` (aus `.env`, optional)
- `GOOGLE_CALENDAR_CLIENT_SECRET` (aus `.env`, optional)
- `GOOGLE_CALENDAR_REDIRECT_URI` (aus `.env`, optional)
- `CLANSCORE_ADMIN_PW` (aus `.env`)
- `CLANSCORE_API_KEY` (aus `.env`)
- `CLANSCORE_API_URL` (aus `.env`, Default: `http://clanscore-api:3000/api`)
- `JWT_SECRET` (aus `.env`)
- `CORS_ORIGIN` (aus `.env`, Default: `http://localhost,http://localhost:4200,http://152.96.10.11,http://srbsci-11.ost.ch`)

**Abhängigkeiten**:
- `mongodb` (mit Health Check Condition)

**Restart-Policy**: `unless-stopped`

### 2. dashboard

#### Dockerfile-Struktur

**Multi-Stage Build**:
1. **Builder Stage** (node:20-alpine):
   - Installiert Build-Tools (python3, make, g++)
   - Installiert Dependencies
   - Erstellt `environment.production.ts` mit API URL
   - Baut Angular Application

2. **Production Stage** (nginx:alpine):
   - Kopiert Nginx-Konfiguration
   - Kopiert Build-Artefakte nach `/usr/share/nginx/html`
   - Startet Nginx

#### Nginx-Konfiguration

**Datei**: `apps/dashboard/nginx.conf`

**Features**:
- Gzip-Kompression
- Health Check Proxy (`/health` → `clanscore-api:3000/health`)
- API Proxy (`/api/*` → `clanscore-api:3000/api/*`)
- Calendar Token OAuth Callback (`/calendarToken` → `clanscore-api:3000/calendarToken`)
- Angular Routing Support (Fallback auf `index.html`)
- Statische Asset-Caching (1 Jahr)

**Wichtige Location-Blocks**:
1. `/health` → API Health Check
2. `/api/health` → API Health Check (spezifisch)
3. `/calendarToken` → OAuth Callback
4. `/api` → API Proxy
5. `/*.(js|css|png|...)` → Statische Assets mit Caching
6. `/` → Angular Routing (try_files)

#### Konfiguration

**Port**: 80 (extern erreichbar)

**Build-Argument**: `CLANSCORE_API_URL`
- Wird zur Build-Zeit verwendet
- Wird in `environment.production.ts` geschrieben
- Unterstützt vollständige URLs oder relative Pfade

**Umgebungsvariablen**: Keine (statische Assets)

**Abhängigkeiten**:
- `clanscore-api` (für API-Proxy)

**Restart-Policy**: `unless-stopped`

### 3. discord-bot

#### Dockerfile-Struktur

**Multi-Stage Build**:
1. **Builder Stage** (node:20-alpine):
   - Installiert Dependencies
   - Baut `shared` Package
   - Baut `discord-bot` Application

2. **Production Stage** (node:20-alpine):
   - Kopiert nur Production Dependencies
   - Kopiert Build-Artefakte
   - Kopiert `public` Folder (Bot-Ressourcen)
   - Startet Bot mit `node dist/index.cjs`

#### Konfiguration

**Port**: 3001 (extern erreichbar, konfigurierbar via `DISCORD_SERVER_PORT`)

**Umgebungsvariablen**:
- `NODE_ENV=production`
- `DISCORD_TOKEN` (aus `.env`)
- `DISCORD_CLIENT_ID` (aus `.env`)
- `DISCORD_GUILD_ID` (aus `.env`)
- `DISCORD_SERVER_PORT` (aus `.env`, Default: 3001)
- `WEBHOOK_SHARED_SECRET` (aus `.env`)
- `GOOGLE_CALENDAR_CLIENT_ID` (aus `.env`, optional)
- `GOOGLE_CALENDAR_CLIENT_SECRET` (aus `.env`, optional)
- `GOOGLE_CALENDAR_REDIRECT_URI` (aus `.env`, optional)
- `CLANSCORE_API_URL` (aus `.env`, Default: `http://clanscore-api:3000/api`)
- `CLANSCORE_API_KEY` (aus `.env`)
- `MONGO_HOST=mongodb`
- `MONGO_PORT=27017`
- `MONGO_DB` (aus `.env`)
- `MONGO_INITDB_ROOT_USERNAME` (aus `.env`)
- `MONGO_INITDB_ROOT_PASSWORD` (aus `.env`)

**Abhängigkeiten**:
- `clanscore-api`
- `mongodb`

**Restart-Policy**: `unless-stopped`

**Funktionen**:
- Discord Slash Commands
- Webhook-Server (Port 3001)
- Event-Synchronisation mit Google Calendar
- API-Integration mit clanscore-api

### 4. mongodb

#### Konfiguration

**Image**: `mongo:8`

**Port**: 27017 (extern erreichbar)

**Health Check**:
```yaml
test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping').ok || exit(1)"]
interval: 10s
timeout: 5s
retries: 5
start_period: 40s
```

**Umgebungsvariablen**:
- `MONGO_INITDB_ROOT_USERNAME` (aus `.env`)
- `MONGO_INITDB_ROOT_PASSWORD` (aus `.env`)

**Volumes**:
- `mongo_data:/data/db` (persistente Daten)

**Restart-Policy**: `unless-stopped`

**Datenbank-Name**: Konfigurierbar via `MONGO_DB` (Default: `clanscore`)

---

## Build-Prozesse

### Build-Ordnung

Aufgrund der Workspace-Struktur müssen Services in folgender Reihenfolge gebaut werden:

1. **shared** Package (wird von allen Apps benötigt)
2. **clanscore-api** (benötigt shared)
3. **discord-bot** (benötigt shared)
4. **dashboard** (unabhängig, aber benötigt API für Proxy)

### Build-Strategien

#### Lokaler Build (Standard)

```bash
docker-compose build
```

**Vorteile**:
- Keine externe Abhängigkeit
- Volle Kontrolle über Build-Prozess
- Kann lokal getestet werden

**Nachteile**:
- Langsamer (baut alles lokal)
- Benötigt Build-Tools auf Host

### Build-Optimierungen

#### Layer-Caching

Dockerfiles sind optimiert für Layer-Caching:
1. Dependencies werden vor Source-Code kopiert
2. Source-Code wird erst nach Dependencies kopiert
3. Änderungen am Source-Code invalidieren nur relevante Layers

#### Multi-Stage Builds

Alle Dockerfiles verwenden Multi-Stage Builds:
- **Builder Stage**: Enthält alle Build-Tools und Dependencies
- **Production Stage**: Enthält nur Runtime-Dependencies und Artefakte

**Vorteile**:
- Kleinere finale Images
- Keine Build-Tools in Production
- Bessere Sicherheit

### Build-Zeiten (Schätzungen)

- **shared**: ~30 Sekunden
- **clanscore-api**: ~2-3 Minuten
- **discord-bot**: ~2-3 Minuten
- **dashboard**: ~5-7 Minuten (Angular Build)

**Gesamt**: ~10-15 Minuten (bei Clean Build)

---

## Netzwerk-Architektur

### Port-Mappings

| Service | Container-Port | Host-Port | Zugriff |
|---------|----------------|-----------|---------|
| dashboard | 80 | 80 | Extern (HTTP) |
| clanscore-api | 3000 | 127.0.0.1:3000 | Nur localhost |
| discord-bot | 3001 | 3001 | Extern (Webhooks) |
| mongodb | 27017 | 27017 | Extern (optional) |

### Interne Kommunikation

Alle Services kommunizieren über Docker DNS:

- `mongodb` → `mongodb:27017`
- `clanscore-api` → `clanscore-api:3000`
- `discord-bot` → `discord-bot:3001`

### Externe Kommunikation

- **Dashboard**: HTTP auf Port 80
- **API**: Nur über Dashboard-Proxy (`/api/*`) oder localhost:3000
- **Discord Bot**: HTTP auf Port 3001 (für Webhooks)
- **MongoDB**: Port 27017 (optional, für direkten Zugriff)

### Firewall-Empfehlungen

**Öffentlich erreichbar**:
- Port 80 (HTTP)
- Port 443 (HTTPS, falls SSL konfiguriert)
- Port 22 (SSH)

**Optional erreichbar**:
- Port 3001 (Discord Bot Webhooks, falls extern benötigt)
- Port 27017 (MongoDB, nur für direkten Zugriff)

**Nicht erreichbar**:
- Port 3000 (API, nur über Dashboard-Proxy)

---

## Umgebungsvariablen und Secrets

### `.env` Datei für Server-Deployment

Für das manuelle Deployment auf dem Server wird eine `.env` Datei im Root-Verzeichnis benötigt.

**Erstellen der `.env` Datei:**

```bash
# Auf dem Server
cp .env.example .env
nano .env  # Alle Werte anpassen
```

**Wichtig**: 
- Die `.env` Datei enthält sensible Daten und wird **nicht** in Git committed!
- Die Datei muss im Root-Verzeichnis des Projekts liegen (gleiche Ebene wie `docker-compose.yml`)

### Vollständige .env Vorlage

Kopiere diese Vorlage und fülle alle Werte aus:

```env
# ============================================
# MongoDB Konfiguration
# ============================================
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your-secure-password-here
MONGO_DB=clanscore

# ============================================
# Discord Bot Konfiguration
# ============================================
DISCORD_TOKEN=your-discord-bot-token-here
DISCORD_CLIENT_ID=your-discord-client-id-here
DISCORD_GUILD_ID=your-discord-guild-id-here
DISCORD_SERVER_PORT=3001

# ============================================
# Webhook Konfiguration
# ============================================
WEBHOOK_SHARED_SECRET=your-webhook-shared-secret-here
DISCORD_BOT_WEBHOOK_URL=http://discord-bot:3001

# ============================================
# Google Calendar OAuth (Optional)
# ============================================
GOOGLE_CALENDAR_CLIENT_ID=your-google-calendar-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-google-calendar-client-secret
GOOGLE_CALENDAR_REDIRECT_URI=http://your-domain.com/calendarToken

# ============================================
# API Konfiguration
# ============================================
CLANSCORE_API_URL=http://clanscore-api:3000/api
CLANSCORE_API_KEY=your-api-key-here
CLANSCORE_ADMIN_PW=your-admin-password-here
JWT_SECRET=your-jwt-secret-here
CORS_ORIGIN=http://localhost,http://localhost:4200,http://152.96.10.11,http://srbsci-11.ost.ch
```

### Erforderliche Umgebungsvariablen (Detailliert)

#### MongoDB

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `MONGO_INITDB_ROOT_USERNAME` | MongoDB Root Username | `admin` |
| `MONGO_INITDB_ROOT_PASSWORD` | MongoDB Root Password | `secure-password` |
| `MONGO_DB` | Datenbank-Name | `clanscore` |

#### Discord Bot

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `DISCORD_TOKEN` | Discord Bot Token | `...` |
| `DISCORD_CLIENT_ID` | Discord Application Client ID | `123456789` |
| `DISCORD_GUILD_ID` | Discord Server (Guild) ID | `987654321` |
| `DISCORD_SERVER_PORT` | Webhook Server Port | `3001` |

#### Webhooks

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `WEBHOOK_SHARED_SECRET` | Geheimer Schlüssel für Webhook-Authentifizierung | `random-secret-key` |
| `DISCORD_BOT_WEBHOOK_URL` | URL des Discord Bot Webhook-Servers | `http://discord-bot:3001` |

#### Google Calendar OAuth

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `GOOGLE_CALENDAR_CLIENT_ID` | Google OAuth Client ID | `...` |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Google OAuth Client Secret | `...` |
| `GOOGLE_CALENDAR_REDIRECT_URI` | OAuth Redirect URI | `http://your-domain.com/calendarToken` |

#### API Konfiguration

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `CLANSCORE_API_URL` | API Base URL | `http://clanscore-api:3000/api` |
| `CLANSCORE_API_KEY` | API Key für Service-to-Service Auth | `api-key-here` |
| `CLANSCORE_ADMIN_PW` | Admin-Passwort | `admin-password` |
| `JWT_SECRET` | Geheimer Schlüssel für JWT-Tokens | `jwt-secret-key` |
| `CORS_ORIGIN` | Erlaubte CORS Origins (komma-separiert) | `http://localhost,http://your-domain.com` |

#### Dashboard Konfiguration

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `CLANSCORE_API_URL` | API URL für Dashboard Build | `http://clanscore-api:3000/api` oder `/api` |

| `DOCKERHUB_TOKEN` | Docker Hub Access Token | `...` |

### Umgebungsvariablen-Mapping

Die Umgebungsvariablen werden in den Services wie folgt verwendet:

#### clanscore-api

Alle oben genannten Variablen werden an den Container weitergegeben.

#### discord-bot

Verwendet:
- Discord-Konfiguration
- Webhook-Konfiguration
- Google Calendar OAuth
- API-Konfiguration
- MongoDB-Konfiguration

#### dashboard

Verwendet nur:
- `CLANSCORE_API_URL` (zur Build-Zeit als Build-Argument)

#### mongodb

Verwendet nur:
- `MONGO_INITDB_ROOT_USERNAME`
- `MONGO_INITDB_ROOT_PASSWORD`

---

## Deployment-Methoden

### 1. Manuelles Deployment

#### Mit Deployment-Skripten

**Linux/Mac**:
```bash
./deploy.sh
```

**Windows PowerShell**:
```powershell
.\deploy.ps1
```

**Was die Skripte tun**:
1. Prüfen ob `.env` existiert
2. Prüfen ob Docker installiert ist
3. Stoppen laufende Services
4. Bauen Images
5. Starten Services
6. Prüfen Container-Status
7. Zeigen Logs bei Fehlern

#### Manuell mit Docker Compose

```bash
# Services bauen und starten
docker-compose up -d --build

# Status prüfen
docker-compose ps

# Logs anzeigen
docker-compose logs -f
```

---

## Health Checks und Monitoring

### Health Check Endpunkte

#### clanscore-api

**Endpoint**: `http://localhost:3000/health`

**Methode**: GET

**Response**: HTTP 200 OK (wenn gesund)

**Docker Health Check**:
```yaml
test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health || exit 1"]
interval: 30s
timeout: 10s
retries: 3
```

#### mongodb

**Docker Health Check**:
```yaml
test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping').ok || exit(1)"]
interval: 10s
timeout: 5s
retries: 5
start_period: 40s
```

### Health Check Status prüfen

```bash
# Alle Container-Status
docker-compose ps

# Health Check Logs
docker inspect --format='{{json .State.Health}}' <container-name> | jq

# Manueller Health Check
curl http://localhost:3000/health
```

### Monitoring-Befehle

```bash
# Container-Status
docker-compose ps

# Container-Logs
docker-compose logs -f

# Ressourcen-Nutzung
docker stats

# System-Ressourcen
htop
df -h
```

### Logging

#### Logs anzeigen

```bash
# Alle Services
docker-compose logs -f

# Einzelner Service
docker-compose logs -f clanscore-api
docker-compose logs -f discord-bot
docker-compose logs -f dashboard
docker-compose logs -f mongodb

# Letzte 100 Zeilen
docker-compose logs --tail=100

# Seit bestimmter Zeit
docker-compose logs --since 10m
```

#### Log-Rotation

Docker verwaltet Logs automatisch. Für manuelle Rotation:

```bash
# Logs löschen (Container muss laufen)
docker-compose logs --tail=0 -f > /dev/null
```

Oder in `docker-compose.yml` konfigurieren:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## Backup-Strategien

### MongoDB Backup

#### Manuelles Backup

```bash
# Backup erstellen
docker-compose exec mongodb mongodump --out /data/backup

# Backup aus Container kopieren
docker cp clanscore-mongodb:/data/backup ./backup-$(date +%Y%m%d)
```

#### Backup-Container

**Dockerfile**: `backup/Dockerfile`

**Zweck**: Dedizierter Container für Backups

**Verwendung**:
```bash
# Backup-Skript ausführen
docker run --rm \
  --network clanscore-network \
  -v $(pwd)/backups:/backups \
  -e MONGO_HOST=mongodb \
  -e MONGO_PORT=27017 \
  -e MONGO_DB=clanscore \
  -e MONGO_USER=admin \
  -e MONGO_PASSWORD=password \
  backup-image \
  mongodump --host=$MONGO_HOST --port=$MONGO_PORT --db=$MONGO_DB --out=/backups/$(date +%Y%m%d)
```

#### Automatisches Backup

**Backup-Skripte**:
- `backup/backup.sh` (Linux/Mac)
- `backup/backup.ps1` (Windows)

**Cron-Job Beispiel** (Linux):
```bash
# Täglich um 2 Uhr morgens
0 2 * * * cd /path/to/clanscore && ./backup/backup.sh
```

### Backup-Wiederherstellung

```bash
# Backup wiederherstellen
docker-compose exec mongodb mongorestore /data/backup

# Oder von externem Backup
docker cp ./backup-20240101 clanscore-mongodb:/data/backup
docker-compose exec mongodb mongorestore /data/backup
```

### Backup-Best Practices

1. **Regelmässige Backups**: Täglich oder wöchentlich
2. **Offsite-Backups**: Backups auf externem Server speichern
3. **Backup-Tests**: Regelmässig Backups testen
4. **Retention-Policy**: Alte Backups nach X Tagen löschen
5. **Verschlüsselung**: Sensitive Backups verschlüsseln

---

## Sicherheit

### Container-Sicherheit

#### Best Practices

1. **Non-Root User**: Services laufen als non-root User (Node.js Alpine Images)
2. **Read-Only Filesystems**: Optional für Production
3. **Resource Limits**: Verhindert DoS-Angriffe
4. **Network Isolation**: Services nur im Docker-Netzwerk erreichbar

#### Security Scanning

```bash
# Docker Images scannen (mit Docker Scout oder Trivy)
docker scout cves clanscore-api:latest
```

### Secrets-Sicherheit

1. **Nie in Git**: `.env` Dateien niemals committen
2. **Rotation**: Secrets regelmässig rotieren
3. **Zugriffskontrolle**: Nur autorisierte Personen haben Zugriff

### Netzwerk-Sicherheit

1. **Firewall**: Nur notwendige Ports öffnen
2. **API-Isolation**: API nur über Dashboard-Proxy erreichbar
3. **MongoDB**: Optional nur intern erreichbar
4. **HTTPS**: SSL/TLS für Production (Let's Encrypt)

### Authentifizierung

#### API-Authentifizierung

- **JWT Tokens**: Für Dashboard-Benutzer
- **API Keys**: Für Service-to-Service Kommunikation
- **Webhook Secrets**: Für Webhook-Authentifizierung

#### MongoDB-Authentifizierung

- **Root Credentials**: Starke Passwörter verwenden
- **Database Users**: Separate User für verschiedene Services (optional)

### Updates und Patches

1. **Regelmässige Updates**: Docker Images regelmässig aktualisieren
2. **Security Patches**: Sofortige Installation von Security Patches
3. **Dependency Updates**: npm Dependencies regelmässig updaten
4. **Base Images**: Aktuelle Base Images verwenden

---

## Troubleshooting

### Häufige Probleme

#### 1. Container startet nicht

**Symptome**:
- Container im Status "Exited" oder "Restarting"
- Logs zeigen Fehler

**Lösung**:
```bash
# Logs prüfen
docker-compose logs <service-name>

# Container-Status prüfen
docker-compose ps

# Container neu starten
docker-compose restart <service-name>
```

#### 2. MongoDB-Verbindungsfehler

**Symptome**:
- API kann nicht mit MongoDB verbinden
- Fehler: "MongoNetworkError" oder "Authentication failed"

**Lösung**:
```bash
# MongoDB-Status prüfen
docker-compose ps mongodb

# MongoDB-Logs prüfen
docker-compose logs mongodb

# Credentials prüfen
docker-compose config | grep MONGO

# MongoDB manuell testen
docker-compose exec mongodb mongosh -u $MONGO_INITDB_ROOT_USERNAME -p $MONGO_INITDB_ROOT_PASSWORD
```

#### 3. API nicht erreichbar

**Symptome**:
- Dashboard kann API nicht erreichen
- CORS-Fehler im Browser

**Lösung**:
```bash
# API-Status prüfen
docker-compose ps clanscore-api

# API-Logs prüfen
docker-compose logs clanscore-api

# Health Check testen
curl http://localhost:3000/health

# CORS-Origin prüfen
docker-compose config | grep CORS_ORIGIN
```

#### 4. Discord Bot verbindet nicht

**Symptome**:
- Bot antwortet nicht auf Commands
- Fehler: "Invalid token" oder "Missing intents"

**Lösung**:
```bash
# Bot-Logs prüfen
docker-compose logs discord-bot

# Token prüfen (nur erste/last Zeichen)
docker-compose config | grep DISCORD_TOKEN

# Bot neu starten
docker-compose restart discord-bot
```

#### 5. Dashboard zeigt Fehler

**Symptome**:
- Dashboard lädt nicht
- API-Calls schlagen fehl

**Lösung**:
```bash
# Dashboard-Logs prüfen
docker-compose logs dashboard

# Nginx-Status prüfen
docker-compose exec dashboard nginx -t

# API-URL prüfen (im Build)
docker inspect clanscore-dashboard | grep CLANSCORE_API_URL
```

### Debug-Befehle

```bash
# Container-Shell öffnen
docker-compose exec <service-name> sh

# Container-Environment prüfen
docker-compose exec <service-name> env

# Netzwerk-Verbindung testen
docker-compose exec <service-name> ping <other-service>

# Port-Verfügbarkeit prüfen
docker-compose exec <service-name> wget -O- http://other-service:port
```

### Log-Analyse

```bash
# Fehler in Logs suchen
docker-compose logs | grep -i error

# Warnungen in Logs suchen
docker-compose logs | grep -i warn

# Letzte 50 Zeilen mit Fehlern
docker-compose logs --tail=50 | grep -i error
```

### Performance-Probleme

```bash
# Ressourcen-Nutzung prüfen
docker stats

# Container-Logs auf Performance-Issues prüfen
docker-compose logs | grep -i "slow\|timeout\|memory"

# MongoDB-Performance prüfen
docker-compose exec mongodb mongosh --eval "db.serverStatus()"
```

---

## Anhang

### Nützliche Befehle

```bash
# Alle Services stoppen
docker-compose down

# Services stoppen und Volumes löschen
docker-compose down -v

# Services neu bauen (ohne Cache)
docker-compose build --no-cache

# Alte Images aufräumen
docker system prune -a

# Docker-System-Info
docker system df
docker system info

# Container-Statistiken
docker stats

# Netzwerk-Info
docker network inspect clanscore-network

# Volume-Info
docker volume inspect clanscore_mongo_data
```

### Referenzen

- [Docker Compose Dokumentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [MongoDB Docker Image](https://hub.docker.com/_/mongo)
- [Node.js Docker Image](https://hub.docker.com/_/node)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)

### Support

Bei Problemen:
1. Prüfe die Logs: `docker-compose logs -f`
2. Prüfe diese Dokumentation
3. Prüfe die [Troubleshooting-Sektion](#troubleshooting)
4. Erstelle ein Issue im [GitHub Repository](https://github.com/ClansCore/clanscore/issues)

---

**Dokumentations-Version**: 1.0  
**Letzte Aktualisierung**: 2024-01-XX  
**Verfasser**: ClansCore Development Team

