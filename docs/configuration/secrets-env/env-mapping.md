# 📋 Umgebungs-Variablen Mapping

Diese Datei zeigt, welche Umgebungs-Variablen wo verwendet werden und wie sie aus `.env` Dateien geladen werden.

## Variablen-Übersicht

### MongoDB
| Variable | Verwendet in | Quelle |
|----------|--------------|--------|
| `MONGO_INITDB_ROOT_USERNAME` | `docker-compose.yml`, `db.init.ts` | `.env` |
| `MONGO_INITDB_ROOT_PASSWORD` | `docker-compose.yml`, `db.init.ts` | `.env` |
| `MONGO_DB` | `docker-compose.yml`, `db.init.ts` | `.env` (Default: `clanscore`) |
| `MONGO_HOST` | `db.init.ts` | `.env` / Docker (Default: `mongodb` im Container) |
| `MONGO_PORT` | `db.init.ts` | `.env` / Docker (Default: `27017`) |

### Discord Bot
| Variable | Verwendet in | Quelle |
|----------|--------------|--------|
| `DISCORD_TOKEN` | `docker-compose.yml`, `config.ts` (API & Bot) | `.env` |
| `DISCORD_CLIENT_ID` | `docker-compose.yml`, `config.ts` (API & Bot) | `.env` |
| `DISCORD_GUILD_ID` | `docker-compose.yml`, `config.ts` (API & Bot) | `.env` |
| `DISCORD_SERVER_PORT` | `docker-compose.yml`, `config.ts` (API & Bot) | `.env` (Default: `3001`) |
| `DISCORD_BOT_WEBHOOK_URL` | `docker-compose.yml`, `config.ts` (API) | `.env` |

### Webhooks
| Variable | Verwendet in | Quelle |
|----------|--------------|--------|
| `WEBHOOK_SHARED_SECRET` | `docker-compose.yml`, `config.ts` (API & Bot) | `.env` |

### Google Calendar
| Variable | Verwendet in | Quelle |
|----------|--------------|--------|
| `GOOGLE_CALENDAR_CLIENT_ID` | `docker-compose.yml`, `config.ts` (API & Bot) | `.env` |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | `docker-compose.yml`, `config.ts` (API & Bot) | `.env` |
| `GOOGLE_CALENDAR_REDIRECT_URI` | `docker-compose.yml`, `config.ts` (API & Bot) | `.env` |

### API Konfiguration
| Variable | Verwendet in | Quelle |
|----------|--------------|--------|
| `CLANSCORE_API_URL` | `docker-compose.yml`, `config.ts` (Bot), `apiClient.ts` | `.env` |
| `CLANSCORE_API_KEY` | `docker-compose.yml`, `config.ts` (Bot), `apiClient.ts` | `.env` |
| `JWT_SECRET` | `docker-compose.yml`, `config.ts` (API), `jwt.ts` | `.env` |
| `CORS_ORIGIN` | `docker-compose.yml`, `config.ts` (API), `server.ts` | `.env` |

### Dashboard
| Variable | Verwendet in | Quelle |
|----------|--------------|--------|
| `CLANSCORE_API_URL` | `docker-compose.yml`, `Dockerfile` (Build-Arg) | `.env` |

## Datei-spezifische Verwendung

### `docker-compose.yml`
Lädt alle Variablen aus `.env` Datei (wenn vorhanden) oder aus Environment-Variablen:
```yaml
environment:
  - VARIABLE_NAME=${VARIABLE_NAME}
  - VARIABLE_NAME=${VARIABLE_NAME:-default_value}  # Mit Default
```

### `apps/clanscore-api/src/config.ts`
Lädt Variablen via `dotenv`:
```typescript
import dotenv from "dotenv";
dotenv.config();
const { VARIABLE } = process.env;
```

### `apps/clanscore-api/src/server.ts`
Verwendet `CORS_ORIGIN` direkt aus `process.env`:
```typescript
origin: process.env.CORS_ORIGIN || 'http://localhost:4200'
```

### `apps/clanscore-api/src/infrastructure/security/jwt.ts`
Verwendet `JWT_SECRET` direkt aus `process.env`:
```typescript
const JWT_SECRET = process.env.JWT_SECRET || "default-secret"
```

### `apps/clanscore-api/src/infrastructure/database/db.init.ts`
Verwendet MongoDB-Variablen direkt aus `process.env`:
```typescript
const host = process.env.MONGO_HOST ?? "localhost";
const port = process.env.MONGO_PORT ?? "27017";
const dbName = process.env.MONGO_DB ?? "clanscore";
```

### `apps/discord-bot/config.ts`
Lädt Variablen via `dotenv`:
```typescript
import dotenv from "dotenv";
dotenv.config();
const { VARIABLE } = process.env;
```

### `apps/discord-bot/src/api/apiClient.ts`
Verwendet API-Variablen direkt aus `process.env`:
```typescript
const BASE = process.env.CLANSCORE_API_URL!;
const KEY = process.env.CLANSCORE_API_KEY;
```

## Lade-Reihenfolge

1. **Lokale Entwicklung**: `.env` Datei wird von `dotenv` geladen
2. **Docker Compose**: Variablen aus `.env` oder Umgebungs-Variablen
3. **Docker Container**: Erhält Variablen als Umgebungs-Variablen von Docker Compose

## Fehlende Variablen

Wenn eine Variable fehlt:
- **In Code**: Fallback-Werte werden verwendet (z.B. `|| 'default'`)
- **In Docker Compose**: Fehler beim Start
- **In Config Files**: `throw new Error("Missing environment variables")`

---
