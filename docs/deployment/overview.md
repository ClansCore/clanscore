# 🚀 ClansCore Deployment - Schnellstart

## Übersicht

Dieses Projekt besteht aus drei Hauptkomponenten:
- **clanscore-api**: Node.js/Express REST API
- **dashboard**: Angular Frontend
- **discord-bot**: Discord Bot

Alle Services werden mit Docker Compose orchestriert.

---

## Voraussetzungen

- Docker & Docker Compose installiert
- Git Repository geklont

---

## Schnellstart

### 1. Konfiguration

Erstelle eine `.env` Datei auf dem Server:

```bash
# Auf dem Server
cp .env.example .env
nano .env  # Alle Werte anpassen
```

**Wichtig:** Die `.env` Datei enthält sensible Daten und sollte niemals ins Git Repository committet werden!

### 2. Deployment

**Linux/Mac:**
```bash
./deploy.sh
```

**Windows:**
```powershell
.\deploy.ps1
```

**Oder manuell:**
```bash
docker-compose up -d --build
```

### 3. Services prüfen

```bash
# Status anzeigen
docker-compose ps

# Logs anzeigen
docker-compose logs -f

# Einzelner Service
docker-compose logs -f clanscore-api
```

### 4. Zugriff

- **API**: http://your-server-ip:3000/api
- **Dashboard**: http://your-server-ip
- **Health Check**: http://your-server-ip:3000/health

## Server-spezifische Konfiguration

Für den Server **srbsci-11.ost.ch** (152.96.10.11):
- Siehe [Quick Start Server](quickstart-server.md) für server-spezifische Anweisungen

---

## Lokale Entwicklung

Für lokale Entwicklung und Tests:
- Siehe [Lokale Entwicklung](../development/local.md) für lokale Setup-Anleitung
- Verwende `.env` Dateien (nur lokal, nie committen!)

---

## Weitere Informationen

- **[Detaillierter Deployment-Stand](deployment-stand.md)** - Umfassende Dokumentation des aktuellen Deployment-Systems
- **[Deployment Guide](guide.md)** - Schritt-für-Schritt-Anleitung für:
  - Erweiterte Konfiguration
  - Reverse Proxy Setup
  - SSL/TLS Konfiguration
  - Troubleshooting
  - Monitoring
