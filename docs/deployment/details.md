# 🔧 Deployment Details

Erweiterte Konfiguration und Details für das Production-Deployment des ClansCore-Systems.

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

---

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

Für detaillierte Backup-Informationen siehe [Backup Guide](../configuration/database/backups-restore.md).

---

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
- Prüfe die Environment-Variablen für MongoDB
- Prüfe die Netzwerk-Konfiguration

### Discord Bot verbindet nicht

- Prüfe den `DISCORD_TOKEN`
- Prüfe die Logs: `docker-compose logs discord-bot`
- Stelle sicher, dass der Bot die richtigen Intents hat

### Dashboard kann API nicht erreichen

- Prüfe die `apiUrl` in der Environment-Datei
- Prüfe die CORS-Konfiguration in der API
- Prüfe die Netzwerk-Konnektivität zwischen Containern

---

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

---

## Sicherheit

- **Umgebungs-Variablen**: Niemals `.env` in Git committen
- **Passwörter**: Verwende starke, eindeutige Passwörter
- **Firewall**: Beschränke den Zugriff auf notwendige Ports
- **Updates**: Halte Docker und das System aktuell
- **Backups**: Regelmässige Backups der Datenbank

---

## Weitere Informationen

- [Deployment Setup](setup.md) - Schnellstart-Anleitung
- [Vollständiger Deployment Guide](guide.md) - Detaillierte Schritt-für-Schritt-Anleitung
- [Server-spezifische Anleitung](quickstart-server.md) - Für srbsci-11.ost.ch
- [Deployment-Skripte](scripts.md) - Automatisierte Deployment-Tools

---

## Support

Bei Problemen:
1. Prüfe die Logs
2. Prüfe die Dokumentation
3. Erstelle ein Issue im [GitHub Repository](https://github.com/ClansCore/clanscore/issues)

