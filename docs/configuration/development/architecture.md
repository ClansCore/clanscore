# 🏗️ Architektur

Übersicht über die Architektur des ClansCore-Systems.

## System-Übersicht

ClansCore folgt einer **Clean Architecture** mit klarer Trennung der Schichten:

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Routes, Controllers, Middleware)      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        Application Layer                │
│  (Use Cases, Business Logic)            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Domain Layer                   │
│  (Entities, Value Objects)             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Infrastructure Layer               │
│  (Database, External Services)         │
└─────────────────────────────────────────┘
```

## Komponenten

### 1. clanscore-api

**Technologie:** Node.js, Express, TypeScript

**Struktur:**
```
apps/clanscore-api/src/
├── presentation/          # API Layer
│   ├── routes/           # Route-Definitionen
│   ├── controllers/      # Request-Handler
│   └── middleware/       # Middleware (Validation, Errors)
├── application/          # Business Logic
│   ├── user/            # User Use Cases
│   ├── gamification/    # Points, Rewards, Leaderboards
│   ├── event/           # Event Management
│   └── notifications/   # Notification Adapters
├── domain/              # Domain Models
│   ├── user/           # User Entities
│   ├── gamification/   # Points, Rewards
│   └── event/          # Event Entities
└── infrastructure/      # External Services
    ├── database/       # MongoDB Integration
    ├── external/       # Discord, Google Calendar
    └── notifications/  # Notification Services
```

**Hauptfunktionen:**
- REST API für Dashboard und Discord Bot
- Benutzerverwaltung
- Gamification (Punkte, Belohnungen, Ranglisten)
- Event-Management
- Kalender-Synchronisation
- Webhook-Integration

### 2. dashboard

**Technologie:** Angular, TypeScript

**Struktur:**
```
apps/dashboard/src/
├── app/
│   ├── components/      # UI Components
│   ├── services/        # API Services
│   ├── models/          # Data Models
│   └── guards/         # Route Guards
└── environments/       # Environment Configs
```

**Hauptfunktionen:**
- Benutzerverwaltung
- Aufgaben-Management
- Event-Verwaltung
- Ranglisten-Verwaltung
- Belohnungen-Verwaltung
- Rollen-Management

### 3. discord-bot

**Technologie:** Node.js, Discord.js, TypeScript

**Struktur:**
```
apps/discord-bot/src/
├── commands/           # Discord Slash Commands
├── api/               # API Client
├── intergration/      # Discord Integrations
├── web/              # Webhook Server
└── utils-discord/    # Discord Utilities
```

**Hauptfunktionen:**
- Slash Commands für Mitglieder
- Event-Synchronisation
- Aufgaben-Management
- Webhook-Endpoints für API
- Automatisierte Benachrichtigungen

## Datenfluss

### Benutzer-Registrierung

```
Discord User
    ↓ (/join command)
Discord Bot
    ↓ (API Call)
clanscore-api
    ↓ (Save to DB)
MongoDB
    ↓ (Webhook)
Discord Bot
    ↓ (Notify Vorstand)
Discord Channel
```

### Aufgaben-Management

```
Vorstand (Dashboard)
    ↓ (Create Task)
clanscore-api
    ↓ (Save to DB)
MongoDB
    ↓ (Webhook)
Discord Bot
    ↓ (Post in Channel)
Discord #aufgaben
```

### Event-Synchronisation

```
Google Calendar
    ↓ (Sync Command)
Discord Bot
    ↓ (API Call)
clanscore-api
    ↓ (Save to DB)
MongoDB
    ↓ (Webhook)
Discord Bot
    ↓ (Update Channel)
Discord #events
```

## Datenbank-Schema

### Haupt-Entitäten

- **Person**: Benutzer/Mitglieder
- **Role**: Discord-Rollen
- **Task**: Aufgaben
- **Event**: Events/Kalender
- **Reward**: Belohnungen
- **Leaderboard**: Ranglisten
- **Transaction**: Punkte-Transaktionen
- **Donation**: Spenden

### Beziehungen

- Person ↔ Role (Many-to-Many)
- Person ↔ Task (Many-to-Many via Participants)
- Person ↔ Transaction (One-to-Many)
- Event ↔ Calendar (One-to-One)

## Kommunikation zwischen Services

### API ↔ Discord Bot

**Webhooks:**
- API sendet Webhooks an Discord Bot
- Endpoint: `http://discord-bot:3001/api/notifications/*`
- Authentifizierung: `x-webhook-token` Header

**Webhook-Endpunkte:**
- `/user-status` - Benutzer-Status-Änderungen
- `/role-changed` - Rollen-Änderungen
- `/role-updated` - Rollen-Updates

### Dashboard ↔ API

**REST API:**
- Base URL: `http://localhost:3000/api` (lokal)
- Authentifizierung: JWT Tokens
- CORS: Konfiguriert für Dashboard-Origin

## Shared Package

Ein gemeinsames Package (`shared/`) enthält:

- **DTOs**: Data Transfer Objects für API-Kommunikation
- **Validation**: Gemeinsame Validierungs-Logik
- **Error Types**: Standardisierte Fehlertypen
- **Channel Names**: Discord Channel-Konstanten

## Sicherheit

### Authentifizierung

- **JWT Tokens** für Dashboard-API-Zugriff
- **Webhook Secrets** für API ↔ Bot Kommunikation
- **OAuth 2.0** für Google Calendar

### Autorisierung

- **Rollen-basiert** (Mitglied, Vorstand, Admin)
- **Middleware** für Route-Protection
- **Discord Permissions** für Bot-Commands

## Deployment

### Docker Compose

Alle Services werden in Docker Containern orchestriert:

- `mongodb`: Datenbank
- `clanscore-api`: REST API
- `discord-bot`: Discord Bot
- `dashboard`: Frontend (Nginx)

### Netzwerk

- Alle Services im gleichen Docker-Netzwerk
- Interne Kommunikation über Service-Namen
- Externe Ports nur für notwendige Services

## Weitere Informationen

- [API-Endpunkte](api-endpoints.md) - Vollständige API-Dokumentation
- [Webhooks](webhooks.md) - Webhook-Integration
- [Datenbank](../database/backups-restore.md) - Datenbank-Backups
