# 🔔 Webhooks - Detaillierte Dokumentation

Dokumentation der Webhook-Integration zwischen ClansCore-api und discord-bot.

## Übersicht

Webhooks ermöglichen die **unidirektionale Kommunikation** zwischen der **clanscore-api** und dem **discord-bot**. Die API sendet Webhooks an den Bot, um über wichtige Änderungen zu informieren, die dann im Discord-Server verarbeitet werden.

### Kommunikationsfluss

```
clanscore-api (Sender)
    ↓ HTTP POST Request
    ↓ x-webhook-token Header
discord-bot Webhook Server (Empfänger)
    ↓ Verarbeitung
    ↓ Discord API Aufrufe
Discord Server (Aktion)
```

### Verwendungszwecke

- **Benutzer-Status-Änderungen**: Bewerbungen akzeptieren/ablehnen
- **Rollen-Management**: Rollen hinzufügen/entfernen, Rollen aktualisieren
- **Synchronisierung**: Automatische User-Synchronisierung via Cron-Job

---

## Architektur

### Komponenten

#### 1. clanscore-api (Sender)

**Datei:** `apps/clanscore-api/src/application/notifications/adapters/discord.adapter.ts`

- **DiscordAdapter**: Implementiert `PlatformAdapter` Interface
- **NotificationService**: Broadcastet Events an alle registrierten Adapter
- **HTTP Client**: Verwendet `fetch()` für Webhook-Requests

#### 2. discord-bot (Empfänger)

**Datei:** `apps/discord-bot/src/web/routes/webhook.routes.ts`

- **Express Router**: Empfängt Webhook-Requests
- **Zod Validation**: Validiert Request-Bodies
- **Discord.js Client**: Führt Discord-Aktionen aus

### Datenfluss

```
┌─────────────────┐
│  Dashboard/API  │
│   (Trigger)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Notification    │
│ Service         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      HTTP POST      ┌─────────────────┐
│ DiscordAdapter  │ ──────────────────► │ Webhook Router  │
│  (clanscore-api)│   x-webhook-token   │  (discord-bot)  │
└─────────────────┘                      └────────┬────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │ Discord API      │
                                          │ (Rollen, DMs)    │
                                          └─────────────────┘
```

---

## Konfiguration

### Umgebungs-Variablen

| Variable | Beschreibung | Beispiel | Erforderlich |
|----------|--------------|----------|--------------|
| `WEBHOOK_SHARED_SECRET` | Geheimer Schlüssel für Authentifizierung | `mein_geheimer_schlüssel_123` | ✅ Ja |
| `DISCORD_BOT_WEBHOOK_URL` | URL des Discord Bot Webhook-Servers | `http://discord-bot:3001` | ✅ Ja |
| `DISCORD_SERVER_PORT` | Port für Webhook-Server | `3001` | ❌ Nein (Standard: 3001) |

### Setup

#### 1. Secret generieren

```bash
# Generiere einen sicheren Secret (mindestens 32 Zeichen)
openssl rand -hex 32
```

**Beispiel-Output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

#### 2. In beiden Services setzen

**clanscore-api** (`.env`):
```env
WEBHOOK_SHARED_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
DISCORD_BOT_WEBHOOK_URL=http://discord-bot:3001
```

**discord-bot** (`.env`):
```env
WEBHOOK_SHARED_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
DISCORD_SERVER_PORT=3001
```

#### 3. Docker Compose

**docker-compose.yml:**
```yaml
services:
  clanscore-api:
    environment:
      - WEBHOOK_SHARED_SECRET=${WEBHOOK_SHARED_SECRET}
      - DISCORD_BOT_WEBHOOK_URL=${DISCORD_BOT_WEBHOOK_URL:-http://discord-bot:3001}
  
  discord-bot:
    environment:
      - WEBHOOK_SHARED_SECRET=${WEBHOOK_SHARED_SECRET}
      - DISCORD_SERVER_PORT=${DISCORD_SERVER_PORT:-3001}
```

### Base URLs

| Umgebung | Base URL |
|----------|----------|
| **Lokal** | `http://localhost:3001/api/notifications` |
| **Docker** | `http://discord-bot:3001/api/notifications` |
| **Production** | `http://<server-ip>:3001/api/notifications` |

---

## Authentifizierung

### Header-basierte Authentifizierung

Alle Webhook-Requests **müssen** den Secret im Header enthalten:

```
x-webhook-token: <WEBHOOK_SHARED_SECRET>
```

### Validierung im Bot

**Datei:** `apps/discord-bot/src/web/routes/webhook.routes.ts`

```typescript
function verifySecret(req: express.Request): string | boolean {
    const token = req.header("x-webhook-token") ?? "";
    return config.WEBHOOK_SHARED_SECRET && token === config.WEBHOOK_SHARED_SECRET;
}
```

### Fehler bei ungültiger Authentifizierung

**Status Code:** `401 Unauthorized`

**Response:**
```json
{
  "error": "Unauthorized"
}
```

---

## Webhook-Endpunkte

### Übersicht

| Endpoint | Methode | Beschreibung | Trigger |
|----------|---------|--------------|---------|
| `/api/notifications/user-status` | POST | Benutzer-Status-Änderung | Bewerbung akzeptiert/abgelehnt |
| `/api/notifications/role-changed` | POST | Rollen-Änderung | Rollen im Dashboard geändert |
| `/api/notifications/role-updated` | POST | Rollen-Update | Rolle im Dashboard aktualisiert |
| `/api/notifications/sync-users` | POST | User-Synchronisierung | Cron-Job oder manuell |

---

### 1. Benutzer-Status-Änderung

**Endpoint:** `POST /api/notifications/user-status`

**Wird aufgerufen wenn:**
- Eine Bewerbung **akzeptiert** wird
- Eine Bewerbung **abgelehnt** wird

**Implementierung:**
- **Sender:** `DiscordAdapter.onApplicationAccepted()` / `onApplicationDenied()`
- **Empfänger:** `webhookRouter.post("/user-status")`

#### Request Body Schema (Zod)

```typescript
const UserStatusSchema = z.object({
  discordId: z.string().min(1),
  status: z.enum(["Accepted", "Denied"]),
  guildId: z.string().min(1).optional(),
  roleName: z.string().min(1).optional(), // nur bei Accepted nötig
});
```

#### Request Body

**Status: Accepted**
```json
{
  "discordId": "123456789012345678",
  "status": "Accepted",
  "guildId": "987654321098765432",
  "roleName": "Mitglied"
}
```

**Status: Denied**
```json
{
  "discordId": "123456789012345678",
  "status": "Denied",
  "guildId": "987654321098765432"
}
```

#### Verhalten

**Bei "Accepted":**
1. ✅ Rolle wird dem Benutzer hinzugefügt (falls `roleName` angegeben)
2. ✅ DM wird an den Benutzer gesendet: `"✅ Hallo <@user>, deine Bewerbung wurde **angenommen**! Willkommen im Verein 🎉"`

**Bei "Denied":**
1. ✅ Rollen "Mitglied" und "Vorstand" werden entfernt (falls vorhanden)
2. ✅ DM wird an den Benutzer gesendet: `"🚫 Hallo <@user>, leider wurde deine Bewerbung **abgelehnt**. Falls du Fragen hast, melde dich beim Vorstand."`

#### Response

**Erfolg:**
```json
{
  "ok": true
}
```

**Fehler:**
```json
{
  "error": "Unauthorized"
}
```
```json
{
  "error": "Guild not found"
}
```
```json
{
  "error": "Member not found"
}
```
```json
{
  "error": "Role not found"
}
```
```json
{
  "error": "ValidationError",
  "details": [
    {
      "path": ["discordId"],
      "message": "Required"
    }
  ]
}
```

#### Status Codes

| Code | Bedeutung |
|------|-----------|
| `200` | Erfolg |
| `400` | Validierungsfehler oder ungültiger Status |
| `401` | Authentifizierungsfehler |
| `404` | Guild, Member oder Rolle nicht gefunden |
| `500` | Interner Serverfehler |

---

### 2. Rollen-Änderung

**Endpoint:** `POST /api/notifications/role-changed`

**Wird aufgerufen wenn:**
- Einem Benutzer eine oder mehrere Rollen **hinzugefügt** werden
- Einem Benutzer eine oder mehrere Rollen **entfernt** werden
- Rollen im Dashboard geändert werden

**Implementierung:**
- **Sender:** `DiscordAdapter.onRoleChanged()`
- **Empfänger:** `webhookRouter.post("/role-changed")`

#### Request Body Schema (Zod)

```typescript
const RoleChangedSchema = z.object({
    discordId: z.string().min(1),
    username: z.string().min(1),
    guildId: z.string().min(1).optional(),
    addRoles: z.array(z.string()).optional().default([]),
    removeRoles: z.array(z.string()).optional().default([]),
    changedBy: z.string().optional(),
});
```

#### Request Body

```json
{
  "discordId": "123456789012345678",
  "username": "Max Mustermann",
  "guildId": "987654321098765432",
  "addRoles": ["Vorstand", "Event-Manager"],
  "removeRoles": ["Mitglied"],
  "changedBy": "Admin Name"
}
```

#### Verhalten

1. ✅ Rollen werden im Discord-Server hinzugefügt/entfernt
2. ✅ Log-Nachricht wird im `bot-log` Channel gesendet (Discord Embed)
3. ✅ Fehler werden gesammelt und in der Response zurückgegeben

#### Response

**Erfolg:**
```json
{
  "ok": true,
  "addedRoles": ["Vorstand", "Event-Manager"],
  "removedRoles": ["Mitglied"],
  "errors": ["Rolle \"NichtExistierend\" nicht gefunden"]
}
```

**Fehler:**
```json
{
  "error": "Unauthorized"
}
```
```json
{
  "error": "Guild not found"
}
```
```json
{
  "error": "Member not found"
}
```
```json
{
  "error": "ValidationError",
  "details": [...]
}
```

#### Discord Embed (Log-Channel)

```
🔄 Rollenänderung (Dashboard)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Benutzer:        @Max Mustermann (Max Mustermann)
Geändert von:    Admin Name
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
➕ Hinzugefügt:  `Vorstand`, `Event-Manager`
➖ Entfernt:     `Mitglied`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 3. Rollen-Update

**Endpoint:** `POST /api/notifications/role-updated`

**Wird aufgerufen wenn:**
- Eine Rolle im Dashboard **aktualisiert** wird (Name, Farbe, etc.)

**Implementierung:**
- **Sender:** `DiscordAdapter.onRoleUpdated()`
- **Empfänger:** `webhookRouter.post("/role-updated")`

#### Request Body Schema (Zod)

```typescript
const RoleUpdatedSchema = z.object({
    guildId: z.string().min(1).optional(),
    oldName: z.string().min(1),
    newName: z.string().min(1),
    color: z.string().nullable().optional(),
    permissions: z.string().nullable().optional(),
    hoist: z.boolean().optional(),
    mentionable: z.boolean().optional(),
    changedBy: z.string().optional(),
});
```

#### Request Body

```json
{
  "guildId": "987654321098765432",
  "oldName": "Mitglied",
  "newName": "Aktives Mitglied",
  "color": "#3498db",
  "hoist": true,
  "mentionable": false,
  "changedBy": "Admin Name"
}
```

#### Verhalten

1. ✅ Rolle wird im Discord-Server aktualisiert
2. ✅ Log-Nachricht wird im `bot-log` Channel gesendet (Discord Embed)
3. ✅ Nur geänderte Felder werden aktualisiert

#### Response

**Erfolg:**
```json
{
  "ok": true,
  "changes": [
    "Name: `Mitglied` → `Aktives Mitglied`",
    "Farbe: `#000000` → `#3498db`",
    "Hervorheben: `false` → `true`"
  ]
}
```

**Fehler:**
```json
{
  "error": "Role \"Mitglied\" not found"
}
```
```json
{
  "error": "Failed to update role"
}
```

#### Discord Embed (Log-Channel)

```
⚙️ Rolle aktualisiert (Dashboard)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Rolle:           `Aktives Mitglied`
Geändert von:    Admin Name
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Änderungen:
Name: `Mitglied` → `Aktives Mitglied`
Farbe: `#000000` → `#3498db`
Hervorheben: `false` → `true`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 4. User-Synchronisierung

**Endpoint:** `POST /api/notifications/sync-users`

**Wird aufgerufen wenn:**
- **Automatisch**: Via Cron-Job (täglich um 3:00 Uhr)
- **Manuell**: Via API-Aufruf

**Implementierung:**
- **Sender:** `apps/clanscore-api/src/infrastructure/cron/jobs.ts`
- **Empfänger:** `webhookRouter.post("/sync-users")`

#### Request Body

```json
{
  "guildId": "987654321098765432"
}
```

#### Verhalten

1. ✅ Führt `performSyncUsers()` aus (gleiche Logik wie `/syncusers` Command)
2. ✅ Synchronisiert alle Benutzer mit Rollen "Mitglied" oder "Vorstand"
3. ✅ Sendet Log-Nachricht in den entsprechenden Discord-Channel

#### Response

**Erfolg:**
```json
{
  "ok": true,
  "changes": 5
}
```

**Fehler:**
```json
{
  "error": "Sync failed",
  "details": "Error details..."
}
```

#### Cron-Job Konfiguration

**Datei:** `apps/clanscore-api/src/infrastructure/cron/jobs.ts`

```typescript
// Täglich um 3:00 Uhr
cron.schedule("0 3 * * *", async () => {
    await fetch(`${config.DISCORD_BOT_WEBHOOK_URL}/api/notifications/sync-users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-webhook-token": config.WEBHOOK_SHARED_SECRET,
        },
        body: JSON.stringify({
            guildId: config.DISCORD_GUILD_ID,
        }),
    });
});
```

---

## Implementierung

### In clanscore-api

#### NotificationService

**Datei:** `apps/clanscore-api/src/application/notifications/notification.service.ts`

Der `NotificationService` ist ein **Singleton**, der alle Adapter verwaltet:

```typescript
import { notificationService } from '../application/notifications';

// Event auslösen
await notificationService.notifyApplicationAccepted({
    userId: person.id,
    platformUserId: person.discordId,
    username: person.name,
    roleName: role.name,
});
```

#### DiscordAdapter

**Datei:** `apps/clanscore-api/src/application/notifications/adapters/discord.adapter.ts`

```typescript
import { DiscordAdapter } from '../application/notifications/adapters/discord.adapter';

const adapter = new DiscordAdapter();

// Prüfen ob aktiviert
if (adapter.isEnabled()) {
    await adapter.onApplicationAccepted({
        type: "application_accepted",
        userId: "...",
        platformUserId: "...",
        username: "...",
        roleName: "...",
    });
}
```

#### Adapter Registrierung

**Datei:** `apps/clanscore-api/src/application/notifications/index.ts`

```typescript
import { DiscordAdapter } from "./adapters/discord.adapter";
import { notificationService } from "./notification.service";

// Adapter wird beim Start registriert
notificationService.register(new DiscordAdapter());
```

### In discord-bot

#### Webhook Server

**Datei:** `apps/discord-bot/src/web/server.ts`

```typescript
import express from "express";
import { webhookRouter } from "./routes/webhook.routes";

export function startHttpServer() {
    const app = express();
    app.use(express.json());
    
    app.get("/health", (_req, res) => res.json({ ok: true }));
    app.use("/api/notifications", webhookRouter);
    
    const port = config.DISCORD_SERVER_PORT;
    app.listen(port, () => {
        console.log(`🔔 Bot webhook server listening on http://localhost:${port}`);
    });
}
```

#### Webhook Routes

**Datei:** `apps/discord-bot/src/web/routes/webhook.routes.ts`

```typescript
import express from "express";
import { z } from "zod";

export const webhookRouter = express.Router();

// Authentifizierung
function verifySecret(req: express.Request): string | boolean {
    const token = req.header("x-webhook-token") ?? "";
    return config.WEBHOOK_SHARED_SECRET && token === config.WEBHOOK_SHARED_SECRET;
}

// Endpoint
webhookRouter.post("/user-status", async (req, res) => {
    if (!verifySecret(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Validierung mit Zod
    const body = UserStatusSchema.parse(req.body);
    
    // Verarbeitung...
});
```

---

## Fehlerbehandlung

### Fehlgeschlagene Requests

#### In der API (Sender)

**Datei:** `apps/clanscore-api/src/application/notifications/adapters/discord.adapter.ts`

```typescript
try {
    const response = await fetch(`${this.baseUrl}/api/notifications/role-changed`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-webhook-token": this.secret,
        },
        body: JSON.stringify({...}),
    });

    if (!response.ok) {
        const errorText = await response.text();
        const errorDetails: ErrorDetails = {
            type: ErrorType.NotificationFailed,
            details: {
                message: `DiscordAdapter.onRoleChanged failed: ${response.status} - ${errorText}`,
                status: response.status,
            }
        };
        getErrorMessage(errorDetails);
    }
} catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails: ErrorDetails = {
        type: ErrorType.NetworkFailure,
        details: {
            message: `DiscordAdapter.onRoleChanged error: ${errorMessage}`,
        }
    };
    getErrorMessage(errorDetails);
}
```

**Wichtige Punkte:**
- ✅ Fehler werden **geloggt**, aber **nicht** geworfen
- ✅ Die API-Operation wird **trotzdem durchgeführt** (Fire-and-Forget)
- ✅ Aktuell **keine automatischen Retries**

#### Im Bot (Empfänger)

**Datei:** `apps/discord-bot/src/web/routes/webhook.routes.ts`

```typescript
try {
    // Verarbeitung...
} catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorDetails: ErrorDetails = {
        type: ErrorType.UnknownError,
        details: {
            message: `user-status error: ${errorMessage}`,
        }
    };
    getErrorMessage(errorDetails);
    
    if (err?.issues) {
        return res.status(400).json({ error: "ValidationError", details: err.issues });
    }
    return res.status(500).json({ error: "InternalError" });
}
```

### Fehlertypen

| Fehlertyp | Beschreibung | HTTP Status |
|-----------|--------------|-------------|
| `Unauthorized` | Ungültiger oder fehlender Token | `401` |
| `ValidationError` | Ungültiger Request Body | `400` |
| `Guild not found` | Discord Server nicht gefunden | `404` |
| `Member not found` | Discord Benutzer nicht gefunden | `404` |
| `Role not found` | Discord Rolle nicht gefunden | `404` |
| `InternalError` | Unerwarteter Serverfehler | `500` |

### Fehlerbehandlung bei DMs

Wenn eine DM nicht gesendet werden kann (z.B. Benutzer hat DMs deaktiviert):

```typescript
try {
    await member.send(`✅ Hallo <@${member.id}>, ...`);
} catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    const errorDetails: ErrorDetails = {
        type: ErrorType.MessageNotSend,
        details: {
            message: `DM failed (Accepted): ${errorMessage}`,
        }
    };
    getErrorMessage(errorDetails);
    // Webhook wird trotzdem als erfolgreich behandelt
}
```

---

## Testing

### Lokales Testen

#### 1. Beide Services starten

```bash
# Terminal 1: API
cd apps/clanscore-api
npm run dev

# Terminal 2: Discord Bot
cd apps/discord-bot
npm run dev
```

#### 2. Webhook manuell testen

**User-Status (Accepted):**
```bash
curl -X POST http://localhost:3001/api/notifications/user-status \
  -H "Content-Type: application/json" \
  -H "x-webhook-token: <WEBHOOK_SHARED_SECRET>" \
  -d '{
    "discordId": "123456789012345678",
    "status": "Accepted",
    "guildId": "987654321098765432",
    "roleName": "Mitglied"
  }'
```

**User-Status (Denied):**
```bash
curl -X POST http://localhost:3001/api/notifications/user-status \
  -H "Content-Type: application/json" \
  -H "x-webhook-token: <WEBHOOK_SHARED_SECRET>" \
  -d '{
    "discordId": "123456789012345678",
    "status": "Denied",
    "guildId": "987654321098765432"
  }'
```

**Role-Changed:**
```bash
curl -X POST http://localhost:3001/api/notifications/role-changed \
  -H "Content-Type: application/json" \
  -H "x-webhook-token: <WEBHOOK_SHARED_SECRET>" \
  -d '{
    "discordId": "123456789012345678",
    "username": "Max Mustermann",
    "guildId": "987654321098765432",
    "addRoles": ["Vorstand"],
    "removeRoles": ["Mitglied"],
    "changedBy": "Test Admin"
  }'
```

**Role-Updated:**
```bash
curl -X POST http://localhost:3001/api/notifications/role-updated \
  -H "Content-Type: application/json" \
  -H "x-webhook-token: <WEBHOOK_SHARED_SECRET>" \
  -d '{
    "guildId": "987654321098765432",
    "oldName": "Mitglied",
    "newName": "Aktives Mitglied",
    "color": "#3498db",
    "hoist": true,
    "mentionable": false,
    "changedBy": "Test Admin"
  }'
```

**Sync-Users:**
```bash
curl -X POST http://localhost:3001/api/notifications/sync-users \
  -H "Content-Type: application/json" \
  -H "x-webhook-token: <WEBHOOK_SHARED_SECRET>" \
  -d '{
    "guildId": "987654321098765432"
  }'
```

### Docker-Testing

```bash
# Services starten
docker-compose up -d

# Logs beobachten
docker-compose logs -f discord-bot

# Webhook testen (von ausserhalb des Containers)
curl -X POST http://localhost:3001/api/notifications/user-status \
  -H "Content-Type: application/json" \
  -H "x-webhook-token: <WEBHOOK_SHARED_SECRET>" \
  -d '{...}'
```

### Test-Szenarien

#### ✅ Erfolgreiche Szenarien

1. **Bewerbung akzeptieren**
   - Request mit `status: "Accepted"` und `roleName`
   - Erwartung: Rolle wird hinzugefügt, DM wird gesendet

2. **Bewerbung ablehnen**
   - Request mit `status: "Denied"`
   - Erwartung: Rollen werden entfernt, DM wird gesendet

3. **Rollen ändern**
   - Request mit `addRoles` und `removeRoles`
   - Erwartung: Rollen werden geändert, Log-Nachricht wird gesendet

#### ❌ Fehler-Szenarien

1. **Ungültiger Token**
   - Request ohne oder mit falschem `x-webhook-token`
   - Erwartung: `401 Unauthorized`

2. **Benutzer nicht gefunden**
   - Request mit nicht existierender `discordId`
   - Erwartung: `404 Member not found`

3. **Rolle nicht gefunden**
   - Request mit nicht existierender `roleName`
   - Erwartung: `404 Role not found`

4. **Validierungsfehler**
   - Request mit fehlenden oder ungültigen Feldern
   - Erwartung: `400 ValidationError` mit Details

---

## Sicherheit

### Best Practices

#### 1. Starker Secret

- ✅ **Mindestens 32 Zeichen** (empfohlen: 64 Zeichen)
- ✅ **Zufällig generiert** (z.B. `openssl rand -hex 32`)
- ✅ **Nicht in Git committen** (nur in `.env` oder Secrets)
- ✅ **Regelmässig rotieren** (bei Verdacht auf Kompromittierung)

#### 2. HTTPS in Production

```env
# Production
DISCORD_BOT_WEBHOOK_URL=https://discord-bot.example.com
```

- ✅ **HTTPS verwenden** für alle Webhook-Requests
- ✅ **Zertifikat-Validierung aktivieren**
- ✅ **Keine Self-Signed Certificates** in Production

#### 3. Rate Limiting

**Aktuell nicht implementiert**, aber empfohlen:

```typescript
import rateLimit from "express-rate-limit";

const webhookLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Minuten
    max: 100, // Max 100 Requests pro Window
    message: "Too many webhook requests"
});

app.use("/api/notifications", webhookLimiter, webhookRouter);
```

#### 4. IP-Whitelisting (Optional)

Falls die API von einer festen IP-Adresse kommt:

```typescript
const allowedIPs = ["10.0.0.1", "10.0.0.2"];

webhookRouter.use((req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!allowedIPs.includes(clientIP)) {
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
});
```

#### 5. Request-Validierung

- ✅ **Zod-Schemas** validieren alle Request-Bodies
- ✅ **Type-Safety** durch TypeScript
- ✅ **Sanitization** von User-Input

---

## Troubleshooting

### "Connection refused"

**Symptom:**
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```

**Lösung:**
1. ✅ Prüfe, ob der Discord Bot läuft: `docker-compose ps discord-bot`
2. ✅ Prüfe `DISCORD_BOT_WEBHOOK_URL` in der API-Konfiguration
3. ✅ Prüfe die Netzwerk-Konnektivität (Docker Network)
4. ✅ Prüfe die Firewall-Regeln

**Docker Network prüfen:**
```bash
docker network inspect clanscore_default
```

### "Invalid webhook token" / "Unauthorized"

**Symptom:**
```json
{
  "error": "Unauthorized"
}
```

**Lösung:**
1. ✅ Prüfe, ob `WEBHOOK_SHARED_SECRET` in **beiden** Services identisch ist
2. ✅ Prüfe den `x-webhook-token` Header im Request
3. ✅ Prüfe, ob der Secret in der `.env` Datei korrekt gesetzt ist
4. ✅ Prüfe, ob keine Leerzeichen oder Sonderzeichen im Secret sind

**Secret vergleichen:**
```bash
# In clanscore-api
echo $WEBHOOK_SHARED_SECRET

# In discord-bot
echo $WEBHOOK_SHARED_SECRET
```

### Webhooks kommen nicht an

**Symptom:**
- Webhook-Requests werden gesendet, aber keine Antwort

**Lösung:**
1. ✅ Prüfe die Logs: `docker-compose logs discord-bot`
2. ✅ Prüfe die Firewall-Regeln
3. ✅ Prüfe die Docker-Netzwerk-Konfiguration
4. ✅ Prüfe, ob der Webhook-Server läuft: `curl http://localhost:3001/health`

**Logs prüfen:**
```bash
# Discord Bot Logs
docker-compose logs -f discord-bot

# API Logs
docker-compose logs -f clanscore-api
```

### "Guild not found"

**Symptom:**
```json
{
  "error": "Guild not found"
}
```

**Lösung:**
1. ✅ Prüfe `DISCORD_GUILD_ID` in der Bot-Konfiguration
2. ✅ Prüfe, ob der Bot Mitglied des Discord-Servers ist
3. ✅ Prüfe, ob die Guild-ID korrekt ist

### "Member not found"

**Symptom:**
```json
{
  "error": "Member not found"
}
```

**Lösung:**
1. ✅ Prüfe, ob die `discordId` korrekt ist
2. ✅ Prüfe, ob der Benutzer Mitglied des Discord-Servers ist
3. ✅ Prüfe, ob der Bot die Berechtigung hat, Mitglieder zu sehen

### "Role not found"

**Symptom:**
```json
{
  "error": "Role not found"
}
```

**Lösung:**
1. ✅ Prüfe, ob die Rolle im Discord-Server existiert
2. ✅ Prüfe, ob der Rollenname **exakt** übereinstimmt (Gross-/Kleinschreibung beachten)
3. ✅ Prüfe, ob der Bot die Berechtigung hat, Rollen zu sehen

### DMs werden nicht gesendet

**Symptom:**
- Webhook ist erfolgreich, aber Benutzer erhält keine DM

**Lösung:**
1. ✅ Prüfe, ob der Benutzer DMs von Server-Mitgliedern erlaubt hat
2. ✅ Prüfe die Bot-Logs für `MessageNotSend` Fehler
3. ✅ Prüfe, ob der Bot die Berechtigung hat, DMs zu senden

**Hinweis:** DMs können nicht gesendet werden, wenn:
- Der Benutzer DMs deaktiviert hat
- Der Benutzer den Bot blockiert hat
- Der Benutzer nicht auf dem Server ist

### Validierungsfehler

**Symptom:**
```json
{
  "error": "ValidationError",
  "details": [
    {
      "path": ["discordId"],
      "message": "Required"
    }
  ]
}
```

**Lösung:**
1. ✅ Prüfe den Request Body gegen das Schema
2. ✅ Prüfe, ob alle erforderlichen Felder vorhanden sind
3. ✅ Prüfe die Datentypen (z.B. `discordId` muss String sein)

---

## Code-Beispiele aus dem Projekt

### Gekapselter Versand über DiscordAdapter

Die API nutzt den `NotificationService` und `DiscordAdapter`, um Discord-relevante Ereignisse zu senden, **ohne Kenntnis über die interne Bot-Logik** zu benötigen. Die Discord-spezifische Implementierung ist vollständig im `DiscordAdapter` gekapselt.

**Datei:** `apps/clanscore-api/src/application/user/user.service.ts`

```typescript
export async function handleAcceptApplication(
    person: PersonEntity,
    roleName: string,
): Promise<Result<PersonEntity, ErrorDetails>> {
    // ... Geschäftslogik (Status-Update, Rollen-Zuweisung) ...
    
    if (person.discordId) {
        const username = person.nickname?.trim() || `${person.firstName} ${person.lastName}`.trim() || "Unbekannt";
        // API ruft NotificationService auf - keine Discord-Details bekannt
        await notificationService.notifyApplicationAccepted({
            userId: person._id.toString(),
            platformUserId: person.discordId,
            username,
            roleName,
        }).catch((error) => {
            // Fehler werden geloggt, führen aber nicht zum Abbruch der Geschäftslogik
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails: ErrorDetails = {
                type: ErrorType.NotificationFailed,
                details: {
                    message: `Bot konnte Benutzerstatus nicht senden: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        });
    }

    return ok(updateStatusResult.value);
}
```

**Datei:** `apps/clanscore-api/src/application/notifications/adapters/discord.adapter.ts`

```typescript
export class DiscordAdapter extends BasePlatformAdapter {
    readonly name = "discord";
    private baseUrl: string;
    private secret: string;

    constructor() {
        super();
        this.baseUrl = config.DISCORD_BOT_WEBHOOK_URL;
        this.secret = config.WEBHOOK_SHARED_SECRET;
    }

    async onApplicationAccepted(event: ApplicationAcceptedEvent): Promise<void> {
        if (!this.isEnabled()) return;

        try {
            // DiscordAdapter sendet HTTP-Webhook - Bot-Logik bleibt verborgen
            const response = await fetch(`${this.baseUrl}/api/notifications/user-status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-webhook-token": this.secret,
                },
                body: JSON.stringify({
                    discordId: event.platformUserId,
                    status: "Accepted",
                    guildId: config.DISCORD_GUILD_ID,
                    roleName: event.roleName,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorDetails: ErrorDetails = {
                    type: ErrorType.NotificationFailed,
                    details: {
                        message: `DiscordAdapter.onApplicationAccepted failed: ${response.status} - ${errorText}`,
                        status: response.status,
                    }
                };
                getErrorMessage(errorDetails);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails: ErrorDetails = {
                type: ErrorType.NetworkFailure,
                details: {
                    message: `DiscordAdapter.onApplicationAccepted error: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        }
    }
}
```

### Webhook-Route mit Zod-Validierung und Secret-Check

Alle Webhook-Endpunkte validieren sowohl die **Authentifizierung** (Secret-Token) als auch die **Payload-Struktur** (Zod-Schema) **vor** der fachlichen Verarbeitung.

**Datei:** `apps/discord-bot/src/web/routes/webhook.routes.ts`

```typescript
import express from "express";
import { z } from "zod";
import { config } from "../../config";

export const webhookRouter = express.Router();

// Secret-Validierung
function verifySecret(req: express.Request): string | boolean {
    const token = req.header("x-webhook-token") ?? "";
    return config.WEBHOOK_SHARED_SECRET && token === config.WEBHOOK_SHARED_SECRET;
}

// Zod-Schema für Payload-Validierung
const UserStatusSchema = z.object({
  discordId: z.string().min(1),
  status: z.enum(["Accepted", "Denied"]),
  guildId: z.string().min(1).optional(),
  roleName: z.string().min(1).optional(), // nur bei Accepted nötig
});

// Webhook-Endpoint mit vollständiger Validierung
webhookRouter.post("/user-status", async (req, res) => {
    try {
        // 1. Authentifizierung prüfen
        if (!verifySecret(req)) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // 2. Payload-Struktur validieren (Zod wirft bei Fehlern)
        const body = UserStatusSchema.parse(req.body);
        
        // 3. Fachliche Verarbeitung (nur wenn Validierung erfolgreich)
        const guildId = body.guildId ?? config.DISCORD_GUILD_ID;
        if (!guildId) return res.status(400).json({ error: "guildId required" });

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: "Guild not found" });

        // ... weitere Verarbeitung ...
        
    } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorDetails: ErrorDetails = {
            type: ErrorType.UnknownError,
            details: {
                message: `user-status error: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
        
        // Zod-Validierungsfehler werden als 400 zurückgegeben
        if (err?.issues) {
            return res.status(400).json({ error: "ValidationError", details: err.issues });
        }
        return res.status(500).json({ error: "InternalError" });
    }
});
```

### Automatisierte Benutzer-Synchronisation

Die Benutzer-Synchronisation nutzt **dieselbe Anwendungslogik** (`performSyncUsers`) sowohl für den manuellen Discord-Command als auch für den automatisierten Webhook-Aufruf.

**Datei:** `apps/clanscore-api/src/infrastructure/cron/jobs.ts`

```typescript
import cron from "node-cron";
import { config } from "../../config";
import { ErrorType, ErrorDetails, getErrorMessage } from "@clanscore/shared";

export function registerCronJobs() {
    // Täglich um 3:00 Uhr: Automatische User-Synchronisierung via Webhook
    cron.schedule("0 3 * * *", async () => {
        console.log("Starte geplante Löschung...");
        await deleteScheduledPersons();
        
        console.log("Starte User-Synchronisierung...");
        try {
            // Webhook-Aufruf an Discord-Bot
            const response = await fetch(`${config.DISCORD_BOT_WEBHOOK_URL}/api/notifications/sync-users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-webhook-token": config.WEBHOOK_SHARED_SECRET,
                },
                body: JSON.stringify({
                    guildId: config.DISCORD_GUILD_ID,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorDetails: ErrorDetails = {
                    type: ErrorType.NetworkFailure,
                    details: {
                        message: `User-Synchronisierung fehlgeschlagen: ${response.status} - ${errorText}`,
                        status: response.status,
                    }
                };
                getErrorMessage(errorDetails);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails: ErrorDetails = {
                type: ErrorType.NetworkFailure,
                details: {
                    message: `Fehler bei User-Synchronisierung: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        }
    });

    console.log("✅ Registered all Cron-Jobs");
}
```

**Datei:** `apps/discord-bot/src/web/routes/webhook.routes.ts`

```typescript
// Webhook-Endpoint für automatische Synchronisation
webhookRouter.post("/sync-users", async (req, res) => {
    try {
        if (!verifySecret(req)) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const guildId = req.body.guildId ?? config.DISCORD_GUILD_ID;
        if (!guildId) return res.status(400).json({ error: "guildId required" });

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: "Guild not found" });

        // Verwendet dieselbe Logik wie der manuelle /syncusers Command
        const syncResult = await performSyncUsers(guild);
        if (!syncResult.ok) {
            return res.status(500).json({ 
                error: "Sync failed", 
                details: syncResult.error 
            });
        }

        return res.json({ 
            ok: true, 
            changes: syncResult.value.changes.length 
        });
    } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorDetails: ErrorDetails = {
            type: ErrorType.UnknownError,
            details: {
                message: `sync-users error: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
        return res.status(500).json({ error: "InternalError" });
    }
});
```

**Datei:** `apps/discord-bot/src/commands/user/syncusers.ts`

```typescript
// Manueller Discord-Command verwendet dieselbe Logik
export async function execute(interaction: CommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild as Guild;
    // Gleiche Funktion wie im Webhook-Endpoint
    const syncResult = await performSyncUsers(guild, `<@${interaction.user.id}>`);

    if (!syncResult.ok) {
        return interaction.editReply(
            getErrorMessage(syncResult.error),
        );
    }

    // ... Ergebnis-Präsentation für Discord ...
}
```

**Wichtig:** Beide Varianten (manuell und automatisch) greifen auf `performSyncUsers()` zurück, wodurch **redundanter Code vermieden** und **konsistentes Verhalten** sichergestellt wird. Synchronisiert werden ausschliesslich Benutzer mit den Rollen "Mitglied" und "Vorstand".

---

## Weitere Informationen

- [API-Endpunkte](api-endpoints.md) - Vollständige API-Dokumentation
- [Architektur](architecture.md) - System-Architektur
- [Konfiguration](../setup.md) - Setup-Anleitung
- [Logging](../../logging/logging-dokumentation.md) - Logging-Dokumentation

---

## Changelog

### Version 1.0.0
- ✅ Initiale Dokumentation
- ✅ 4 Webhook-Endpunkte dokumentiert
- ✅ Vollständige Request/Response-Schemas
- ✅ Fehlerbehandlung dokumentiert
- ✅ Testing-Anleitung
- ✅ Troubleshooting-Guide
