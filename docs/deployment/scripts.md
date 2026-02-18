# 🚀 Deployment-Skripte

Dieses Projekt enthält Deployment-Skripte für schnelles und einfaches Deployment.

---

## Verfügbare Skripte

### `deploy.sh` / `deploy.ps1`

**Zweck:** Deployment-Script für manuelles Deployment  
**Verwendung:** `./deploy.sh` (Linux/Mac) oder `.\deploy.ps1` (Windows)  

**Funktion:**
- Prüft ob `.env` existiert
- Prüft ob Docker installiert ist
- Stoppt laufende Services
- Baut alle Images
- Startet Services
- Zeigt Status und Logs

---

## Manuelles Deployment

Falls du die Skripte nicht verwenden möchtest, kannst du auch direkt mit Docker Compose deployen:

```bash
# Alle Services bauen und starten
docker-compose up -d --build

# Status prüfen
docker-compose ps

# Logs anzeigen
docker-compose logs -f
```

---

## Weitere Informationen

- [Deployment Guide](guide.md) - Vollständige Anleitung
- [Server-spezifische Anleitung](quickstart-server.md) - Für srbsci-11.ost.ch
