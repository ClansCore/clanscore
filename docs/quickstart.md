# 🚀 Schnellstart

ClansCore besteht aus drei Hauptkomponenten:

- **clanscore-api**: Node.js/Express REST API für Backend-Logik
- **dashboard**: Angular Frontend für Administratoren
- **discord-bot**: Discord-Bot für Vereinsmitglieder

Alle Services werden mit Docker Compose orchestriert.

---

## Voraussetzungen

- Docker & Docker Compose installiert
- Git Repository geklont
- (Optional) GitHub Repository mit aktivierten Actions für automatisches Deployment

---

## Anleitung

### 1. Konfiguration

Erstelle eine `.env` Datei auf dem Server:

```bash
# Auf dem Server
cp .env.example .env
nano .env  # Alle Werte anpassen
```

**Wichtig:** Die `.env` Datei enthält sensible Daten und sollte niemals ins Git Repository committet werden!

Siehe [Umgebungsvariablen Dokumentation](deployment/deployment-stand.md#umgebungsvariablen-und-secrets) für die vollständige Vorlage.

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

---

## Nächste Schritte

### Für lokale Entwicklung

- [Lokale Entwicklung](development/local.md) - Setup ohne Docker
- [Lokales Docker Setup](development/local-docker.md) - Docker-basierte Entwicklung

### Für Production-Deployment

- [Deployment Guide](deployment/guide.md) - Vollständige Anleitung
- [Server-spezifische Anleitung](deployment/quickstart-server.md) - Für srbsci-11.ost.ch

---

## Weitere Informationen

Siehe [Deployment Guide](deployment/guide.md) für:

- Erweiterte Konfiguration
- Reverse Proxy Setup
- SSL/TLS Konfiguration
- Troubleshooting
- Monitoring

---
