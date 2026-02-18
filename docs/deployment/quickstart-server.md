# ⚡ Quick Start für srbsci-11.ost.ch

Schnellstart-Anleitung für Ihren Server.

---

## Schnellstart

### 1. SSH-Verbindung testen

```bash
ssh <benutzername>@srbsci-11.ost.ch
# ODER
ssh <benutzername>@<server_ip>
```

### 2. Docker installieren (falls noch nicht vorhanden)

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Docker Compose installieren

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### 4. Projekt auf Server klonen/kopieren

**Wichtig:** GitHub unterstützt keine Passwort-Authentifizierung mehr!

**Option A: Mit SSH-Key (Empfohlen)**
```bash
# SSH-Key erstellen (falls noch nicht vorhanden)
ssh-keygen -t ed25519 -C "ins@srbsci-11.ost.ch" -f ~/.ssh/id_ed25519

# Öffentlichen Key anzeigen und zu GitHub hinzufügen
cat ~/.ssh/id_ed25519.pub
# Gehe zu: https://github.com/settings/keys

# Mit SSH klonen
cd ~
git clone git@github.com:ClansCore/clanscore.git
cd clanscore
```

**Option B: Mit Personal Access Token**
```bash
cd ~
git clone https://github.com/ClansCore/clanscore.git
# Username: yutubi
# Password: <Ihr Personal Access Token>
cd clanscore
```

Siehe [SSH Setup](../configuration/ssh-setup.md) für detaillierte Anleitung.

### 5. Umgebungs-Variablen konfigurieren

Erstelle eine `.env` Datei auf dem Server:

```bash
# Auf dem Server
cp .env.example .env
nano .env  # Alle Werte anpassen
```

**Wichtig:** Die `.env` Datei enthält sensible Daten und sollte niemals ins Git Repository committet werden!

### 6. Services starten

```bash
# Services starten
docker-compose up -d --build
```

### 7. Status prüfen

```bash
# Services prüfen
docker-compose ps

# Logs anzeigen
docker-compose logs -f

# Health Check
curl http://localhost:3000/health
```

### 8. Zugriff

- **Dashboard**: http://<server_ip> oder http://srbsci-11.ost.ch
- **API**: http://<server_ip>:3000/api
- **Health Check**: http://<server_ip>:3000/health

---

## Wichtige Befehle

```bash
# Services neu starten
docker-compose restart

# Einzelnen Service neu starten
docker-compose restart clanscore-api

# Services stoppen
docker-compose down

# Services stoppen und Volumes löschen (⚠️ Achtung: Datenverlust!)
docker-compose down -v

# Logs eines Services
docker-compose logs -f clanscore-api

# In Container einsteigen
docker-compose exec clanscore-api sh

# System-Ressourcen prüfen
docker stats
htop
df -h
```

---

## Troubleshooting

### Port bereits belegt

```bash
# Prüfen welche Ports belegt sind
sudo netstat -tulpn | grep LISTEN

# Service auf anderem Port starten (in docker-compose.yml anpassen)
```

### Zu wenig Speicher

```bash
# Docker aufräumen
docker system prune -a --volumes

# Alte Images löschen
docker image prune -a
```

### MongoDB startet nicht

```bash
# MongoDB Logs prüfen
docker-compose logs mongodb

# MongoDB Container neu starten
docker-compose restart mongodb
```

---

## Nächste Schritte

- ✅ Reverse Proxy mit Nginx einrichten (siehe [Deployment Guide](guide.md))
- ✅ SSL/TLS mit Let's Encrypt konfigurieren
- ✅ Monitoring einrichten
- ✅ Automatische Backups konfigurieren

Siehe [Deployment Guide](guide.md) für detaillierte Server-Konfiguration.

