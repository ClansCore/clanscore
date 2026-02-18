# 📅 Kalender-Integration

Das ClansCore-System synchronisiert Events zwischen Google Calendar und Discord. Events aus dem Google Calendar werden automatisch im Discord-Server angezeigt und können vom Vorstand verwaltet werden:

- **Bidirektionale Synchronisation:** Google Calendar ↔ Discord
- **Automatische Event-Erinnerungen** in Discord
- **Teilnahme-Verwaltung** über Discord
- **OAuth 2.0 Authentifizierung** für sicheren Zugriff

---

Um ClansCore mit dem Google Calendar verbinden zu können, ist eine einmalige Konfiguration in der Google Cloud notwendig. Dabei wird ein Projekt erstellt, API-Zugriff eingerichtet und die Authentifizierungsdaten generiert, die anschliessend als Secrets beim Projekt hinterlegt werden. Diese Schritte ermöglichen es dem Bot, Kalenderfunktionen wie das Abrufen und Verknüpfen von Terminen sicher über OAuth2 zu nutzen.

## 1. Google Cloud Console

1. **Projekt erstellen:**
   - Gehe zu: https://console.cloud.google.com
   - Melde dich mit dem Vereins-Google-Account an
   - IAM und Verwaltung → Projekt erstellen
   - Gib dem Projekt einen Namen

2. **Google Calendar API aktivieren:**
   - APIs und Dienste → Bibliothek
   - Suche nach "Google Calendar API"
   - Klicke auf "Aktivieren"

3. **OAuth-Zustimmungsbildschirm:**
   - APIs und Dienste → OAuth‑Zustimmungsbildschirm → Zielgruppe
   - Füge bei Testnutzer den Vereins-Google-Account hinzu

---

## 2. OAuth 2.0 Credentials

1. **Client ID erstellen:**
   - APIs und Dienste → Anmeldedaten
   - Anmeldedaten erstellen → OAuth‑Client‑ID
   - Anwendungstyp: "Webanwendung"

2. **Autorisierte Weiterleitungs-URIs:**
   - **Lokal:** `http://localhost:3000/calendarToken`
   - **Production (ohne Port):** `http://your-domain.com/calendarToken` oder `https://your-domain.com/calendarToken`
   
   ⚠️ **Wichtig:** 
   - Die URI muss exakt übereinstimmen!
   - Für Production: Verwende **KEINEN** Port in der URI (z.B. `http://srbsci-11.ost.ch/calendarToken`, NICHT `http://srbsci-11.ost.ch:3000/calendarToken`)
   - Der `/calendarToken` Endpoint wird über den Nginx Reverse Proxy auf Port 80 erreichbar gemacht

3. **Credentials speichern:**
   - Kopiere die **Client-ID**
   - Kopiere den **Clientschlüssel**
   - Speicher diese sicher

---

## 3. Secrets / Umgebungs-Variablen

Setze die entsprechenden Secrets oder Variablen:

```
GOOGLE_CALENDAR_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/calendarToken
```

**Für Production:**
```env
# WICHTIG: Kein Port in der URI! Der Endpoint wird über Nginx auf Port 80 erreichbar gemacht
GOOGLE_CALENDAR_REDIRECT_URI=http://srbsci-11.ost.ch/calendarToken
# ODER mit HTTPS (falls SSL konfiguriert):
# GOOGLE_CALENDAR_REDIRECT_URI=https://srbsci-11.ost.ch/calendarToken
```

---

## Kalender verknüpfen

Führe diesen Bot-Befehl im Discord-Server aus:

```
/linkcalendar
```

OAuth-Flow:

1. Der Bot sendet einen Link
2. Klicke auf den Link
3. Du wirst zu Google weitergeleitet
4. Autorisiere den Zugriff
5. Du wirst zurückgeleitet
6. Der Bot bestätigt die Verknüpfung

Mit dem folgenden Bot-Befehl startest du die Synchronisation aller Events aus dem Google Calendar mit Discord manuell:

```
/synccalendar
```

---
<!-- 
## API-Endpunkte

### Kalender-Info

**GET** `/api/calendar/info/:guildId`
- Ruft Kalender-Informationen ab

**PUT** `/api/calendar/info/:guildId`
- Speichert Kalender-Informationen

### OAuth

**GET** `/api/calendar/link-url`
- Generiert OAuth-Link

**GET** `/api/calendar/callback`
- Verarbeitet OAuth-Callback

### Synchronisation

**POST** `/api/calendar/sync`
- Synchronisiert Google Calendar → Datenbank

**POST** `/api/calendar/from-discord/create`
- Erstellt Event von Discord → Google Calendar

**POST** `/api/calendar/from-discord/update`
- Aktualisiert Event von Discord → Google Calendar

**GET** `/api/calendar/provider-events`
- Ruft Events vom Provider (Google Calendar) ab

## Funktionsweise

### Google Calendar → Discord

1. **Synchronisation:**
   ```
   /synccalendar
   ```

2. **Ablauf:**
   - Bot ruft Events aus Google Calendar ab
   - Events werden in Datenbank gespeichert
   - Events werden im Discord `#events` Channel angezeigt

3. **Automatische Updates:**
   - Events werden regelmässig aktualisiert
   - Änderungen werden im Discord reflektiert

### Discord → Google Calendar

1. **Event erstellen:**
   - Vorstand erstellt Event im Dashboard
   - Event wird in Datenbank gespeichert
   - Event wird an Google Calendar gesendet

2. **Event aktualisieren:**
   - Änderungen im Dashboard
   - Automatische Synchronisation mit Google Calendar

## Event-Verwaltung

### Discord-Commands

| Befehl | Beschreibung |
|--------|--------------|
| `/events` | Zeigt geplante Events |
| `/linkcalendar` | Verknüpft Google Calendar |
| `/synccalendar` | Synchronisiert Events |

### Dashboard

- Event-Erstellung
- Event-Bearbeitung
- Teilnehmer-Verwaltung
- Event-Details

## Event-Erinnerungen

Der Bot sendet automatisch Erinnerungen für anstehende Events:

- **24 Stunden vorher**
- **1 Stunde vorher**

Erinnerungen werden im Discord `#events` Channel gepostet.

-->
## Troubleshooting

### "OAuth callback failed" / "ERR_CONNECTION_REFUSED"

- Prüfe die `GOOGLE_CALENDAR_REDIRECT_URI` in der `.env` Datei
- Diese muss exakt mit der in Google Cloud Console übereinstimmen
- **Für Production:** Verwende KEINEN Port in der URI (z.B. `http://srbsci-11.ost.ch/calendarToken`, NICHT `http://srbsci-11.ost.ch:3000/calendarToken`)
- Prüfe, ob der Nginx Proxy `/calendarToken` weiterleitet (siehe `apps/dashboard/nginx.conf`)
- Prüfe, ob der Server auf Port 80 erreichbar ist: `curl http://your-domain.com/calendarToken?code=test&state=test`

### "Calendar not linked"

- Führe `/linkcalendar` erneut aus
- Prüfe die OAuth-Credentials
- Prüfe die Logs: `docker-compose logs discord-bot`

### "Sync failed"

- Prüfe die Google Calendar API-Berechtigungen
- Prüfe, ob der Kalender zugänglich ist
- Prüfe die Logs: `docker-compose logs ClansCore-api`

### "Events not showing in Discord"

- Führe `/synccalendar` aus
- Prüfe, ob der `#events` Channel existiert
- Prüfe die Bot-Berechtigungen im Discord Server und Channel

---

## Best Practices

### Sicherheit

1. **OAuth-Credentials:**
   - Niemals in Git committen
   - Verwende GitHub Secrets für Production
   - Regelmässig rotieren

2. **Berechtigungen:**
   - Minimal notwendige Berechtigungen
   - Nur auf Vereins-Kalender zugreifen

### Wartung

1. **Regelmässige Synchronisation:**
   - Täglich automatische Sync
   - Manuelle Sync bei Bedarf

2. **Event-Bereinigung:**
   - Alte Events automatisch archivieren
   - Regelmässig Kalender aufräumen

---

## Weitere Informationen

- [API-Endpunkte](../development/api-endpoints.md) - Vollständige API-Dokumentation
- [Konfiguration](../setup.md) - Setup-Anleitung
- [Discord Bot](../../bot/manual.md) - Bot-Funktionen

---
