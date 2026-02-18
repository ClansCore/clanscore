# Discord-Bot für Vereine

Ein Discord-Bot für Vereine mit Node.js, TypeScript und Discord.js.

📘 **Link zum [Benutzerhandbuch](https://discord-bot-8daa5b.pages.ost.ch/)**

![Discord-Server Default Notification Settings](/public/resources/bot-server.jpg)

## Inhaltsverzeichnis

- [Discord-Bot für Vereine](#discord-bot-für-vereine)
  - [Inhaltsverzeichnis](#inhaltsverzeichnis)
  - [Features](#features)
  - [Installation](#installation)
  - [Entwicklung](#entwicklung)
  - [Backup und Wiederherstellung](#backup-und-wiederherstellung)
  - [Integration im Discord-Server](#integration-im-discord-server)
    - [Discord-Server vorbereiten](#discord-server-vorbereiten)
    - [Bot einladen](#bot-einladen)
    - [Installation und Umgebungsvariablen](#installation-und-umgebungsvariablen)
    - [Rollen und Benutzer synchronisieren](#rollen-und-benutzer-synchronisieren)
    - [Benutzerhandbuch](#benutzerhandbuch)
  - [Integration mit Google Calendar](#integration-mit-google-calendar)
  - [Verbindung mit MongoDB Compass](#verbindung-mit-mongodb-compass)
  - [Erstellung eines Punktesystems](#erstellung-eines-punktesystems)
    - [Spenden](#spenden)
    - [Aufgaben und Events](#aufgaben-und-events)
    - [Belohnungs-System](#belohnungs-system)
    - [Punktebeispiel pro Jahr (aktives Mitglied)](#punktebeispiel-pro-jahr-aktives-mitglied)
    - [Verhältnis Kontrolle](#verhältnis-kontrolle)
  - [Lizenz](#lizenz)

---

## Features

- **Mitgliederverwaltung** - Bewerbung, Rollenvergabe, DSGVO-konforme Datenspeicherung
- **Event-Synchronisation** - Google Calendar Integration, Erinnerungen und Teilnahme über Discord
- **Gamification-System** - Rangliste und Belohnungen sowie Punkte für Events, Aufgaben, Spenden
- **Aufgaben und Feedback** - Aufgaben ausschreiben und automatische Punktevergabe mit Feedback nach Erledigung
- **Rollen- und Nutzerabgleich** - Datenbank-Synchronisation mit `/syncroles` und `/syncusers`
- **Automatisierung** - Zeitgesteuerte Aktionen mit `node-cron`
- **Datenhaltung und Hosting** - MongoDB/Mongoose für Speicherung, lokal oder auf Server lauffähig

---
<!-- 
## Installation

1. Repository klonen:

    ```
    git clone <repo-url>
    cd discord-bot
    ```

2. Abhängigkeiten installieren:

    ```
    npm install
    ```

3. Umgebungsvariablen konfigurieren:

    Erstelle eine `.env`-Datei im Projektverzeichnis.

    ```
    # https://discord.com/developers/applications/.../oauth2
    DISCORD_TOKEN=...
    DISCORD_CLIENT_ID=...

    # Rechtsklick auf den Discord-Server > klick "Copy Server ID"
    DISCORD_GUILD_ID=...

    # https://console.cloud.google.com/ > APIs & Services
    GOOGLE_CALENDAR_CLIENT_ID=...apps.googleusercontent.com
    GOOGLE_CALENDAR_CLIENT_SECRET=...
    GOOGLE_CALENDAR_REDIRECT_URI="..."

    # Lokale DB-Instanz
    MONGO_HOST=localhost
    MONGO_PORT=27017
    MONGO_DB=discordbot

    # Nur setzten, wenn nicht lokal!
    # MONGO_INITDB_ROOT_USERNAME=admin
    # MONGO_INITDB_ROOT_PASSWORD=...

    # Passwort für die Ver- / Entschlüsselung der Backups
    GPG_PW=...

    STATUTEN="..."
    TERMS_OF_SERVICE="..."
    STATUTEN_URI="..."
    TERMS_OF_SERVICE_URI="..."
    MANUAL_URI="https://discord-bot-8daa5b.pages.ost.ch/"
    ```

4. Bot local builden und starten:

    ```
    npm run build
    npm start
    ```

5. Bot als Docker Container starten:

    ```
    docker-compose up --build
    ```

---

## Entwicklung

Bot im Entwicklungsmodus starten (mit automatischem Neustart bei Änderungen):

```
npm run dev
```

Code-Qualität prüfen:

```
npx eslint .
```

Code formatieren:

```
npx prettier . --write
```

Tests ausführen:

```
npm test
``` -->

---
<!-- 
## Backup und Wiederherstellung

Für das Projekt steht ein vollständiges **Backup- und Restore-System** der MongoDB-Datenbank zur Verfügung.

Dieses System basiert auf Docker und bietet:

- Tägliche automatische Backups (als `.tar.gz`-Archiv)
- Manuelle Sicherungen via Script (`backup.sh` oder `backup.ps1`)
- Optionale GPG-Verschlüsselung
    - Setze hierfür in der `.env`-Datei `GPG_PW`
- Restore-Funktion zur Wiederherstellung einzelner Datenstände

**Details dazu findest du im [Backup-README](./BACKUP-README.md)** -->

---

<!-- ## Integration im Discord-Server

Befolge diese Schritte, damit der Bot korrekt auf deinem Discord-Server läuft.


### Discord-Server vorbereiten

Bevor der Discord-Bot voll funktionsfähig im Server verwendet werden kann, müssen die notwendigen Channels manuell in Discord erstellt werden.

Diese sind im Backend unter `src\channelNames.ts` definiert.

```
export const ChannelNames = {
    RULES: "regeln",
    EVENTS: "events",
    LEADERBOARDS: "rangliste",
    TASKS: "aufgaben",
    COMMANDS: "bot-befehle",
    APPLICATIONS: "bot-bewerbungen",
    REWARDS: "bot-belohnungen",
    COMPLETED_TASKS: "bot-aufgaben",
} as const;

export type ChannelName = (typeof ChannelNames)[keyof typeof ChannelNames];
```

| Channel-Name    | Beschreibung |
| --------------- | ------------ |
| regeln          | Regel-Channel mit allen wichtigen Richtlinien zu Verein und Datenschutz der Nutzer. |
| events          | Events-Channel mit Übersicht der nächsten 5 Events inkl. Event-Benachrichtigungen. |
| rangliste       | Ranglisten-Channel mit der Auflistung aller existierenden Ranglisten. |
| aufgaben        | Aufgaben-Channel, in dem die offenen Aufgaben publiziert und beansprucht werden können. |
| bot-befehle     | Befehls-Channel der als zentraler Ort für alle Bot-Befehle genutzt werden kann. |
| bot-bewerbungen | Vorstands-Bereich: Hier werden alle Bewerbungen zur Bearbeitung und auch Austritte angezeigt. |
| bot-belohnungen | Vorstands-Bereich: Hier werden alle angeforderten Belohnungen zur Bearbeitung angezeigt. |
| bot-aufgaben    | Vorstands-Bereich: Hier werden alle erledigten Aufgaben zur Bearbeitung angezeigt. |

**Wichtiger Hinweis:** 
- Der Channel-Bereich "vorstand" sollte dementsprechend nur für Vorstandsmitglieder sichtbar sein.
- Der Discord-Server sollte grundsätzlich in den Server-Einstellungen stummgeschaltet werden, da ansonsten immer wieder Benachrichtigungen hervorgehoben werden. (Aktualisierung der Event-Übersicht und Ranglisten)

![Discord-Server Default Notification Settings](/public/resources/bot-channel-settings.jpg)

### Bot einladen

1. Gehe zur Discord Developer Console:
   [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. Wähle deine erstellte Applikation aus.
3. Unter **Bot > Privileged Gateway Intents**:
   * Aktiviere "Server Members Intent"
   * Aktiviere "Message Content Intent"

![Discord Developer Einstellungen für den Bot](/public/resources/discord-dev-settings.jpg)

4. Unter **OAuth2 > OAuth2 URL Generator**:

   * Wähle die Scopes: `bot`, `applications.commands`
   * Setze Bot Permissions: `Administrator`, `Manage Roles`, `View Channels`, `Manage Events`, `Create Events`, `Send Messages`, `Manage Messages`
   * Setze den Integration Type auf `Guild Install`, kopiere den generierten Link und lade den Bot auf dein Server ein.

![Discord Developer Permissions für den Bot](/public/resources/discord-dev-permissions.jpg) -->


### Installation und Umgebungsvariablen

Installiere und starte den Bot wie oben in Kapitel [Installation](#installation) beschrieben und stelle sicher, dass Umgebungsvariablen in der `.env`-Datei korrekt gesetzt sind.

Starte den Bot wie im Kapitel beschrieben.


### Rollen und Benutzer synchronisieren

Führe **diese zwei Befehle** aus, um die erste Synchronisation mit deinem Server und der Datenbank durchzuführen:

1. `/syncroles` - Synchronisiert alle Rollen zwischen Discord und Datenbank.

2. `/syncusers` - Speichert alle Benutzer mit den Rollen `Mitglied` oder `Vorstand` in der Datenbank.

Damit sind alle Rollen korrekt zugewiesen, und der Bot kann Benutzer und ihre Aktivitäten richtig erfassen.

**Wichtiger Hinweis:** Nach jeder manuellen Rollenänderung in Discord (z. B. Zuweisung der Rolle "Vorstand") sollte der Befehl `/syncusers` benutzt werden, um dies in der Datenbank wirksam zu machen und so erweiterte Rollenberechtigung zu erhalten.

Jetzt ist der Bot startklar! 🎉


### Benutzerhandbuch

Hier findest du eine Anleitung und weitere Hilfe zur Nutzung: **[Benutzerhandbuch](https://discord-bot-8daa5b.pages.ost.ch/)**

---
<!-- 
## Integration mit Google Calendar

Um den Bot mit dem Google Calendar verbinden zu können, ist eine einmalige Konfiguration in der Google Cloud notwendig. Dabei wird ein Projekt erstellt, API-Zugriff eingerichtet und die Authentifizierungsdaten generiert, die anschliessend in der `.env`-Datei des Projekts hinterlegt werden. Diese Schritte ermöglichen es dem Bot, Kalenderfunktionen wie das Abrufen und Verknüpfen von Terminen sicher über OAuth2 zu nutzen.

1. Gehe zur Google Cloud Console [https://console.cloud.google.com](https://console.cloud.google.com).
2. Melde dich wenn mit deinem Vereins-Google-Account an.
3. Klicke oben links auf das Menu-Icon dann auf **IAM und Verwaltung > Projekt erstellen**. Erstelle das Projekt.
4. Wähle oben im Header das neu erstellte Projekt aus.
5. Navigiere zu **APIs und Dienste > Bibliothek**, suche nach "Google Calendar API" und klicke auf "Aktivieren".
6. Navigiere zu **APIs und Dienste > OAuth‑Zustimmungsbildschirm > Zielgruppe**, geh zu Testnutzer und füge den Google-Account hinzu
7. Navigiere zu **APIs und Dienste > Anmeldedaten** und klicke oben auf **Anmeldedaten erstellen > OAuth‑Client‑ID**.
   - Anwendungstyp: "Webanwendung"
   - Autorisierte Weiterleitungs-URIs: exakt die URL eintragen, die der Bot verwendet, z. B.
       - Lokal: `http://localhost:3000/calendarToken`
       - Produktion (Beispiel): `https://deine-domain.tld/calendarToken`
8.  Klicke auf Erstellen und speichere die **Client-ID** und den **Clientschlüssel** sicher ab.
9.  Setze in der .env-Datei folgende Variablen:
    * GOOGLE_CALENDAR_CLIENT_SECRET = `<Clientschlüssel>`
    * GOOGLE_CALENDAR_CLIENT_ID = `<ClientID>`
    * GOOGLE_CALENDAR_REDIRECT_URI = `<Weiterleitungs-URI>`

Jetzt kannst du deinen Google Calendar mit dem `/linkcalendar`-Befehl mit dem Discord-Bot verbinden. -->

---
<!-- 
## Verbindung mit MongoDB Compass

Es ist möglich sich extern über [MongoDB Compass](https://www.mongodb.com/try/download/compass) mit der Datenbank zu verbinden. Hierzu muss auf dem Server ein Endpunkt gegen aussen geöffnet werden:

`<deine-server-url>:27018`

Der Port kann in `docker-compose.yml` angepasst werden.

In der `.env`-Datei muss jetzt ein **sicheres** Passwort bei `MONGO_INITDB_ROOT_PASSWORD` gesetzt werden (mind. 20 Stellen inkl. Symbole und Zahlen).

Danach kannst du dich mit MongoDB Compass verbinden und einloggen. Möglichkeiten:

- Add new connection > Advanced Connection Options > Authentication (dann Username/Password eingeben)
- URI: `mongodb://admin:***@<deine-serer-url>:27018/` (ersetze "***" mit dem Passwort)


**Wichtiger Hinweis:** Es gibt momentan keine zusätzliche Sicherheits-Barriere, bis auf dieses Passwort. Der User hat damit Admin-Rechte in der Datenbank und somit volle Zugriffskontrolle. **Behandle das Passwort streng geheim** oder lass den Endpunkt geschlossen, falls du ihn nicht benötigst. -->

---

## Erstellung eines Punktesystems

Dieses Punktesystem ist ein Vorschlag und dient dem Vorstand als Orientierung für die optimale Einbindung von Gamification durch den Discord-Bot. Es sollte jährlich an die Bedürfnisse und Aktivitäten des Vereins angepasst und kommuniziert werden.

**Wichtiger Hinweis:** Die Punktevergabe erfolgt **nicht automatisch** durch den Discord-Bot. Sie muss vom Vorstand aktiv berücksichtigt und umgesetzt werden, z. B. bei der Erstellung oder Bewertung von Aufgaben.

Für die Planung und Berechnung der einzelnen Werte kann der zur Verfügung gestellte [Punkte-Rechner](./public/pointsystem_calculator.xlsx) verwendet werden.

Ein solides Punktesystem stärkt das Vertrauen der Mitglieder und motiviert zur aktiven Beteiligung.

> **Empfohlener Umrechnungskurs**: CHF 1.- entspricht **15 Punkten**


### Spenden

Spenden werden belohnt, jedoch mit **monatlicher Begrenzung**. Dies soll Anreize schaffen, ohne ein Pay-to-Win-System zu fördern.

| Annahme / Planung              | Berechnung                    | Max. Punkte pro Jahr |
| ------------------------------ | ----------------------------- | -------------------- |
| 5 Mitglieder spenden je CHF 50 | 5 Spender _ CHF 50.- _ 5 Pkt. | 1250 Pkt. / Jahr     |

> Dies entspricht eine Punktevergabe von **1250 Punkte** pro Vereinsjahr für Spendenanreize.

| Betrag           | Punkte   |
| ---------------- | -------- |
| ab CHF 15.-      | 75 Pkt.  |
| ab CHF 50.-      | 250 Pkt. |
| bis zu CHF 100.- | 500 Pkt. |

Ab einem Spendebetrag von CHF 100.- pro Monat werden nicht mehr als 500 Punkte vergeben.


### Aufgaben und Events

| Annahme / Planung                      | Berechnung                        | Max. Punkte pro Jahr |
| -------------------------------------- | --------------------------------- | -------------------- |
| 30 Aufgaben (je 3 Arbeitsstunden)      | 30 Aufgaben \* 3 h \* 30 Pkt.     | 2700 Pkt. / Jahr     |
| 8 Events (je 15 Teilnehmer)            | 8 Events \* 15 Pers. \* 10 Pkt.   | 1200 Pkt. / Jahr     |
| 2 Umfragen (je 15 Teilnehmer)          | 2 Umfragen \* 15 Pers. \* 10 Pkt. | 300 Pkt. / Jahr      |
| Mitglieder-Rekrutierung (2 Teilnehmer) | 2 Rekrutierungen \* 150 Pkt.      | 300 Pkt. / Jahr      |

> Gesamthaft ergibt sich eine Punktevergabe von **4500 Punkten** pro Jahr für Aktivitäten.

| Aufgabe / Aktivität                           | Punkte (teils pro Arbeitsstunde)                            |
| --------------------------------------------- | ----------------------------------------------------------- |
| Social Media (Zusammenschnitte / Aufnahmen)   | 30 Pkt. / h                                                 |
| Hilfe beim Event (z. B. Organisation, Aufbau) | 30 Pkt. / h                                                 |
| Aufträge vom Vorstand                         | 30 Pkt. / h                                                 |
| Teilnahme an Event                            | 10 Pkt.                                                     |
| Teilnahme an Umfrage                          | 10 Pkt.                                                     |
| Mitglieder-Rekrutierung                       | 150 (pro beigetretenes Mitglied = 10% vom Mitgliederbeitrag) |


### Belohnungs-System

Die Belohnungen sollten **vereinsspezifisch** ausgestaltet und regelmässig überarbeitet werden. Diese Tabelle dient als Startpunkt:

| Belohnung                                     | Punkte nötig | Gegenwert  |
| --------------------------------------------- | ------------ | ---------- |
| Rabattcode im Vereins-Shop                    | 150          | CHF 5.-    |
| Vereins-Merch (genauere Aufschlüsslung nötig) | 600          | CHF 20.-   |
| Vereins-Mitgliedschaft                        | 1500         | CHF 50.-   |
| Discord-Ranglistenplatz und Auszeichnung      | Automatisch  | Symbolisch |

> Ziel: Die Belohnungen sollen motivieren, aber **kein finanzieller Vorteil** oder Wettbewerb gegenüber anderen erzeugen.


### Punktebeispiel pro Jahr (aktives Mitglied)

| Quelle                     | Punkte (realistisch)    |
| -------------------------- | ----------------------- |
| CHF 30.- Spenden           | 30 \* 5 Pkt. = **150**  |
| 3h Aufgaben                | 3h \* 30 Pkt. = **90**  |
| 5 Eventteilnahmen          | 4 \* 10 Pkt. = **40**   |
| 1 Umfrage                  | 1 \* 10 Pkt. = **10**   |
| 1 Mitglieder-Rekrutierung  | 1 \* 150 Pkt. = **150** |
| **Total**                  | **440 Punkte**          |

> Ein Mitglied kann sich also nach einem aktiven Vereinsjahr z. B. 2 Rabattcodes je CHF 5.- einlösen oder sich nach 1.5 Jahren 1 Vereins-Merch im Wert von CHF 20.- leisten.


### Verhältnis Kontrolle

| Kategorie               | Vereinsnutzen                        | Punktevergabe  | Begründung                                                             |
| ----------------------- | ------------------------------------ | -------------- | ---------------------------------------------------------------------- |
| Spenden                 | Einnahmensteigerung                  | Mittel         | Starker Anreiz bei gleichzeitig realem Geldeingang                     |
| Aufgaben                | Konkrete Arbeitsleistung, Entlastung | Hoch           | Arbeits-Leistung mit direktem Nutzen für den Verein                    |
| Events                  | Sichtbarkeit, Community-Aktivierung  | Mittel         | Teilnahme zeigt Engagement, geringer Aufwand pro Person                |
| Umfragen und Vorschläge | Einbindung, Transparenz              | Niedrig-Mittel | Beitrag zur Weiterentwicklung, aber geringer Aufwand                   |
| Mitglieder-Rekrutierung | Mitgliederwachstum, strategisch      | Sehr hoch      | Hoher Aufwand bei hohem Nutzen                                         |
| Belohnungen             | Motivation, Bindung                  | Kontrolliert   | Ausgabe erfolgt erst bei Aktivität, Aufwand und Prüfung durch Vorstand |

---

## Lizenz

Dieses Projekt steht unter der [GNU General Public License v3.0 (GPL-3.0)](LICENSE).

Du darfst den Code verwenden, verändern und teilen - solange du:

- Unsere Autorenschaft nennst (Vanessa Alves und Marco Schnider),
- Den Quellcode ebenfalls offenlegst und unter GPL-3.0 veröffentlichst.

---
