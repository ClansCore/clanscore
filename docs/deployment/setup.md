# 🚀 Deployment Setup

Schnellstart-Anleitung für das Deployment des ClansCore-Systems auf einem Server.

---

## Voraussetzungen

- Virtueller Server mit:
  - Docker (Version 20.10 oder höher)
  - Docker Compose (Version 2.0 oder höher)
  - Mindestens 2GB RAM
  - Mindestens 10GB freier Speicherplatz

---

## Schnellstart

### 1. Server vorbereiten

```bash
# Docker installieren (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose installieren
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Neu einloggen, damit Docker-Gruppe aktiv wird
```

### 2. Projekt auf Server klonen

**Wichtig:** GitHub unterstützt keine Passwort-Authentifizierung mehr!

**Option A: Direkt auf Server klonen (Empfohlen)**
```bash
# Auf dem Server: SSH-Key einrichten (siehe [SSH Setup](../configuration/ssh-setup.md))
git clone git@github.com:ClansCore/clanscore.git
cd clanscore
```

**Option B: Per SCP vom lokalen Rechner**
```bash
# Auf Ihrem lokalen Rechner
git clone <repository-url>
cd clanscore

# Auf Server kopieren
scp -r clanscore user@your-server.com:~/
```

### 3. Umgebungs-Variablen konfigurieren

Erstelle eine `.env` Datei auf dem Server:

```bash
# Auf dem Server
cp .env.example .env
nano .env  # Alle Werte anpassen
```

**Wichtig:** Die `.env` Datei enthält sensible Daten und sollte niemals ins Git Repository committet werden!

### 4. Services starten

```bash
# Alle Services bauen und starten
docker-compose up -d --build

# Logs anzeigen
docker-compose logs -f

# Status prüfen
docker-compose ps
```

### 5. Services verifizieren

- **API**: `http://your-server-ip:3000/api`
- **Dashboard**: `http://your-server-ip`
- **Discord Bot**: Läuft im Hintergrund

---

## Nächste Schritte

Nach dem erfolgreichen Setup:

- [Vollständiger Deployment Guide](guide.md) - Detaillierte Schritt-für-Schritt-Anleitung
- [Deployment Details](details.md) - Erweiterte Konfiguration (Reverse Proxy, SSL, etc.)
- [Server-spezifische Anleitung](quickstart-server.md) - Für srbsci-11.ost.ch
- [Deployment-Skripte](scripts.md) - Automatisierte Deployment-Tools

---

## Support

Bei Problemen:
1. Prüfe die Logs: `docker-compose logs -f`
2. Lese die [Troubleshooting-Sektion](../development/troubleshooting.md)
3. Erstelle ein Issue im [GitHub Repository](https://github.com/ClansCore/clanscore/issues)

