# Deployment Guide - ClansCore

Dieser Guide erklärt, wie du die drei Anwendungen (ClansCore-api, dashboard, discord-bot) auf einem virtuellen Server deployen kannst.

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

### 2. Projekt auf Server kopieren

**Wichtig:** GitHub unterstützt keine Passwort-Authentifizierung mehr!

**Option A: Direkt auf Server klonen (Empfohlen)**
```bash
# Auf dem Server: SSH-Key einrichten (siehe [SSH Setup](../configuration/ssh-setup.md))
git clone git@github.com:ClansCore/clanscore.git
cd clanscore
```

**Option B: Per SCP vom lokalen Rechner**
```bash
# Auf deinem lokalen Rechner
git clone <repository-url>
cd clanscore

# Auf Server kopieren
scp -r clanscore ins@srbsci-11.ost.ch:~/
```

Siehe [SSH Setup](../configuration/ssh-setup.md) für Authentifizierungs-Optionen.

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

## Erweiterte Konfiguration

### Reverse Proxy mit Nginx (Empfohlen für Production)

Für Production solltest du einen Reverse Proxy verwenden:

1. **Nginx auf dem Server installieren:**
```bash
sudo apt update
sudo apt install nginx
```

2. **Nginx-Konfiguration erstellen** (`/etc/nginx/sites-available/clanscore`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Dashboard
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. **Konfiguration aktivieren:**
```bash
sudo ln -s /etc/nginx/sites-available/clanscore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL/TLS mit Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Firewall konfigurieren

```bash
# UFW Firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## Wartung

### Logs anzeigen

```bash
# Alle Services
docker-compose logs -f

# Einzelner Service
docker-compose logs -f clanscore-api
docker-compose logs -f discord-bot
docker-compose logs -f dashboard
```

### Services neu starten

```bash
# Alle Services
docker-compose restart

# Einzelner Service
docker-compose restart clanscore-api
```

### Updates deployen

```bash
# Code aktualisieren
git pull

# Services neu bauen und starten
docker-compose up -d --build

# Alte Images aufräumen
docker system prune -a
```

### Datenbank-Backup

```bash
# Backup erstellen
docker-compose exec mongodb mongodump --out /data/backup

# Backup wiederherstellen
docker-compose exec mongodb mongorestore /data/backup
```

## Troubleshooting

### Service startet nicht

1. **Logs prüfen:**
```bash
docker-compose logs <service-name>
```

2. **Container-Status prüfen:**
```bash
docker-compose ps
docker ps -a
```

3. **Umgebungs-Variablen prüfen:**
```bash
docker-compose config
```

### MongoDB-Verbindungsfehler

- Prüfe, ob MongoDB läuft: `docker-compose ps mongodb`
- Prüfe die Umgebungs-Variablen für MongoDB
- Prüfe die Netzwerk-Konfiguration

### Discord Bot verbindet nicht

- Prüfe den `DISCORD_TOKEN`
- Prüfe die Logs: `docker-compose logs discord-bot`
- Stelle sicher, dass der Bot die richtigen Intents hat

### Dashboard kann API nicht erreichen

- Prüfe die `apiUrl` in der Environment-Datei
- Prüfe die CORS-Konfiguration in der API
- Prüfe die Netzwerk-Konnektivität zwischen Containern

## Monitoring

### Health Checks

Die Services haben Health Checks konfiguriert. Prüfe den Status:

```bash
docker-compose ps
```

### Ressourcen-Monitoring

```bash
# Container-Ressourcen
docker stats

# System-Ressourcen
htop
df -h
```

## Sicherheit

- **Environment-Variablen**: Niemals `.env` in Git committen
- **Passwörter**: Verwende starke, eindeutige Passwörter
- **Firewall**: Beschränke den Zugriff auf notwendige Ports
- **Updates**: Halte Docker und das System aktuell
- **Backups**: Regelmässige Backups der Datenbank

## Support

Bei Problemen:
1. Prüfe die Logs
2. Prüfe die Dokumentation
3. Erstelle ein Issue im Repository

