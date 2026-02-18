# 📚 ClansCore Dokumentation

Willkommen zur vollständigen Dokumentation für **ClansCore**!

![Discord-Server Default Notification Settings](resources/bot-server.jpg)

---

## Projekt-Übersicht

ClansCore ist ein umfassendes System für Vereine mit drei Hauptkomponenten:

- **🚀 clanscore-api**: Node.js/Express REST API
- **📊 dashboard**: Angular Frontend
- **🤖 discord-bot**: Discord Bot für Vereinsmanagement

Alle Services werden mit Docker Compose orchestriert und können sowohl lokal als auch auf einem Server deployed werden.

---

## Schnellstart

Neue Benutzer sollten mit dem [Schnellstart-Guide](quickstart.md) beginnen.

### Für Entwickler

- [Lokale Entwicklung](development/local.md) - Setup ohne Docker
- [Lokales Docker Setup](development/local-docker.md) - Docker-basierte Entwicklung

### Für Systemadministratoren

- [Deployment Guide](deployment/guide.md) - Vollständige Server-Deployment-Anleitung
- [Umgebungs-Variablen](deployment/deployment-stand.md#umgebungsvariablen-und-secrets) - .env Konfiguration

---

## Dokumentations-Bereiche

### ⚙️ Konfiguration

- [Einrichtung](configuration/setup.md) - Vollständige Setup-Anleitung
- [Umgebungs-Variablen](configuration/secrets-env/env-mapping.md) - Alle Variablen erklärt
- [.env Vorlage](deployment/deployment-stand.md) - Vollständige .env Vorlage
- [SSH Setup](configuration/ssh-setup.md) - SSH-Authentifizierung

**Entwicklung:**
- [Architektur](configuration/development/architecture.md) - System-Architektur
- [API-Endpunkte](configuration/development/api-endpoints.md) - Vollständige API-Dokumentation
- [Webhooks](configuration/development/webhooks.md) - Webhook-Integration
- [Testing](configuration/development/testing.md) - Testing-Strategie (Jasmine/Karma & Jest)

**Datenbank:**
- [Backups & Restore](configuration/database/backups-restore.md) - Datenbank-Backups

**Kalender:**
- [Kalender-Integration](configuration/calendar/integration.md) - Google Calendar Setup

### 🚀 Deployment

- [Übersicht](deployment/overview.md) - Schnellstart und Übersicht
- **[Deployment-Stand](deployment/deployment-stand.md)** - Detaillierte Dokumentation des aktuellen Deployment-Systems
- [Setup](deployment/setup.md) - Schnellstart-Anleitung für Deployment
- [Vollständiger Guide](deployment/guide.md) - Detaillierte Schritt-für-Schritt-Anleitung
- [Details](deployment/details.md) - Erweiterte Konfiguration (Reverse Proxy, SSL, etc.)
- [Server-spezifisch](deployment/quickstart-server.md) - Für srbsci-11.ost.ch
- [Deployment-Skripte](deployment/scripts.md) - Automatisierte Deployment-Tools

### 💻 Entwicklung

- [Lokale Entwicklung](development/local.md) - Setup ohne Docker
- [Lokales Docker](development/local-docker.md) - Docker-basierte Entwicklung
- [Troubleshooting](development/troubleshooting.md) - Häufige Probleme lösen

### 📊 Dashboard

- [Benutzerhandbuch](dashboard/manual.md) - Vollständiges Handbuch für Benutzer

### 🤖 Discord Bot

- [Benutzerhandbuch](bot/manual.md) - Vollständiges Handbuch für Benutzer

---

## Technologie-Stack

- **Database**: MongoDB
- **ClansCore-API (Backend)**: Node.js, Express, TypeScript
- **Dashboard (Frontend)**: Angular
- **Discord-Bot**: Discord.js
- **Container**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

---

## Weitere Ressourcen

- [GitHub Repository](https://github.com/ClansCore/clanscore) - Source Code

---

## Hilfe & Support

Bei Problemen:

1. Prüfe die [Troubleshooting-Sektion](development/troubleshooting.md)
2. Lese die entsprechende Dokumentation
3. Erstelle ein Issue im [GitHub Repository](https://github.com/ClansCore/clanscore/issues)

---

**Letzte Aktualisierung**: Diese Dokumentation wird kontinuierlich aktualisiert. Für die neuesten Informationen besuche das [GitHub Repository](https://github.com/ClansCore/clanscore).

---
