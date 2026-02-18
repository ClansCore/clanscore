# 📘 Benutzerhandbuch - Discord-Bot für Vereine

Willkommen beim offiziellen Handbuch für den Vereins-Bot!
Dieses Manual zeigt dir, wie du den Bot optimal nutzt.

## Inhaltsverzeichnis

- [🤖 Nutzen des Bots](#nutzen-des-bots)
- [🔐 Rollenübersicht](#rollenübersicht)
- [📺 Channel-Beschreibung](#channel-beschreibung)
- [💬 Befehls-Übersicht](#befehls-übersicht)
    - [Für alle Mitglieder](#für-alle-mitglieder)
    - [Nur für Vorstand](#nur-für-vorstand)
- [🏆 Gamification](#gamification)
    - [Das Punktesystem](#das-punktesystem)
    - [Belohnungen für Punkte](#belohnungen-für-punkte)
    - [Rangliste](#rangliste)
    - [Wichtiger Hinweis](#wichtiger-hinweis)
- [🧩 Tutorials](#tutorials)
    - [Vereins-Beitritt](#vereins-beitritt)
    - [Aufgaben erstellen / erledigen](#aufgaben-erstellen-erledigen)
    - [Punkte für Belohung einlösen](#punkte-für-belohung-einlösen)
- [📄 Datenschutz & DSGVO](#datenschutz--dsgvo)
- [❓ Hilfe & Support](#hilfe-support)

---

## 🤖 Nutzen des Bots

Der Discord-Bot unterstützt den Verein bei:

- Mitgliederaufnahme und Rollenvergabe
- Event-Synchronisation mit Google Calendar
- Gamification mit Punktesystem und Belohnungen
- Datenschutzkonforme Datenspeicherung
- Admin-Management (Befehlssteuerung, Datenabgleich)

---

## 🔐 Rollenübersicht

| Rolle                | Beschreibung                                                                          |
| -------------------- | ------------------------------------------------------------------------------------- |
| `Community-Mitglied` | Status nach Serverbeitritt. Keine Rolle oder Vereinsrechte.                           |
| `Mitglied`           | Offiziell bestätigte Vereinsmitglieder mit Zugang zur Punktesammlung und Belohnungen. |
| `Vorstand`           | Vorstandsmitglieder mit Zugriff auf erweiterte Bot-Befehle und Management-Funktionen. |
| `Admin`              | Adminrechte für Einrichtungs- und Verwaltungs-Spezifische Bot-Befehle |

---

## 📺 Channel-Beschreibung

| Kanalname            | Zweck                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `#regeln`            | Regeln und Datenschutzinformationen (Opt-in bei Beitritt).                                                      |
| `#events`            | Übersicht aller Vereins-Events und Ankündigungen sowie Erinnerungen für anstehende Events.                      |
| `#rangliste`         | Zeigt die aktivsten Mitglieder im Punktesystem.                                                                 |
| `#aufgaben`          | Offene Vereinsaufgaben, die von Mitgliedern beansprucht und dann erledigt werden können (mit Punkte-Belohnung). |
| **`#bot-befehle`**   | **Bereich für die Eingabe und Erklärung aller verfügbaren Befehle rund um den Bot.**                            |
| _`#bot-bewerbungen`_ | **Vorstand-Bereich:** Verwaltung eingereichter Bewerbungen durch den Vorstand.                                  |
| _`#bot-belohnungen`_ | **Vorstand-Bereich:** Liste der aktuell verfügbaren Belohnungen für Punkte.                                     |
| _`#bot-aufgaben`_    | **Vorstand-Bereich:** Archiv der bereits erledigten Aufgaben (transparente Punktevergabe).                      |

---

## 💬 Befehls-Übersicht

### Für alle Mitglieder

| Befehl          | Beschreibung                                          |
| --------------- | ----------------------------------------------------- |
| `/join`         | Bewerbe dich als Vereinsmitglied.                     |
| `/events`       | Zeigt geplante Vereins-Events aus dem Kalender.       |
| `/score`        | Zeigt dir deinen Punktestand und Rang.                |
| `/completetask` | Markiert eine zugewiesene Aufgabe als erledigt.       |
| `/rewards`      | Zeigt verfügbare Belohnungen, die du einlösen kannst. |
| `/getdata`      | Zeigt dir alle gespeicherten Daten laut DSGVO.        |
| `/leave`        | Verlässt den Verein (löscht Rolle & Daten).           |

### Nur für Vorstand

| Befehl               | Beschreibung                                                         |
| -------------------- | -------------------------------------------------------------------- |
| `/donation`          | Erfasst eine Spende (z. B. Geld oder Sachspende) und vergibt Punkte. |
| `/createtask`        | Erstellt eine neue Vereinsaufgabe mit Beschreibung und Punktewert.   |
| `/createleaderboard` | Erstellt eine neue Rangliste (saisonal, jährlich etc.).              |

### Nur für Admins

| Befehl               | Beschreibung                                                         |
| -------------------- | -------------------------------------------------------------------- |
| `/linkcalendar`      | Verknüpft einen Google Kalender mit dem Discord-Server.              |
| `/synccalendar`      | Synchronisiert alle Events mit dem verknüpften Kalender.             |
| `/syncroles`         | Gleicht Rollen im Discord mit der Vereinsdatenbank ab.               |
| `/syncusers`         | Aktualisiert Mitgliederliste anhand Discord-Rollen und DB-Daten.     |

---

## 🏆 Gamification

Der Discord-Bot belohnt deine Aktivität im Verein mit Punkten.
Diese Punkte kannst du später gegen Belohnungen eintauschen, wie zum Beispiel Vereins-Merch.

### Das Punktesystem

Wenn du dich aktiv im Vereinsleben einbringst, erhältst du Punkte. Zum Beispiel für:

| Aktivität              | Typisches Beispiel                          |
| ---------------------- | ------------------------------------------- |
| Teilnahme an Events    | LAN-Party, Offline- oder Online-Events      |
| Erledigen von Aufgaben | Aufbauhilfe, Grafiken, Social Media etc.    |
| Teilnahme an Umfragen  | Feedback zu Vereinsentscheidungen           |
| Neue Mitglieder werben | Freund oder Freundin erfolgreich eingeladen |
| Spenden                | Finanzielle Unterstützung für den Verein    |

Die Punkte werden dir gutgeschrieben, sobald deine Teilnahme oder Leistung bestätigt wurde.

### Belohnungen für Punkte

Du kannst deine gesammelten Punkte gegen Belohnungen eintauschen. Die aktuelle Liste siehst du mit dem Befehl `/rewards` im Channel `#bot-befehle`.

Beispiele für Belohnungen:

| Belohnung             | Beschreibung                        |
| --------------------- | ----------------------------------- |
| Rabattcode            | z. B. CHF 5.- im Vereins-Shop       |
| Vereins-Merch         | T-Shirt, Hoodie, Trikot etc.        |
| Gratis-Mitgliedschaft | Für besonders engagierte Mitglieder |

### Rangliste

Im Channel `#rangliste` kannst du sehen, wie aktiv andere Mitglieder sind und wie du im Vergleich stehst.

Ein bisschen Wettbewerb, aber fair: Punkte sind Motivation, **es gitb dadurch keinen Vorteil bei Abstimmungen oder Events**.

### Wichtiger Hinweis

- Die Punktevergabe erfolgt durch den Vorstand - **immer nachvollziehbar und transparent**.
- Du kannst deinen Punktestand jederzeit mit dem Befehl `/score` im Channel `#bot-befehle` einsehen.
- Punkte sind nicht übertragbar und verfallen nicht automatisch.

> ℹ️ Du möchtest wissen, wie Punkte genau vergeben werden? Frag einfach den Vorstand oder wirf einen Blick ins [README](https://gitlab.ost.ch/saba-discord_bot/discord-bot).

---

## 🧩 Tutorials

Alle Befehle werden im Channel **`#bot-befehle`** ausgeführt.

### Vereins-Beitritt

- Das Nicht-Mitglied gibt `/join` im Bot-Channel ein und füllt seine Daten aus. Dabei müssen zwingend die Datenschutzrichtlinien akzeptiert werden.
- Das Nicht-Mitglied bekommt über eine Privat-Nachricht die Zahlungs-Informationen des Vereins und bezahlt damit den fälligen Mitgliederbeitrag.
- Der Vorstand wird im Channel `#bot-bewerbungen` benachrichtigt und kontrolliert die Zahlung des Mitgliederbeitrages.
- Der Vorstand entscheidet nach Zahlungsbestätigung über die Aufnahme des Nicht-Mitglieds mithilfe der Buttons `Akzeptieren` / `Ablehnen`.
- Das Nicht-Mitglied wird privat über den Entscheid kontaktiert und erhält dann entweder die Rolle Mitglied oder hat weiterhin keine Vereins-Rechte. (Bei Ablehnung wird der Mitglieder-Beitrag selbstverständlich zurückerstattet)

### Aufgaben erstellen / erledigen

- Der Vorstand erstellt mit `/createtask` diverse Aufgaben woraufhin diese im Channel `#aufgaben` publiziert werden.
- Mitglieder können diese Aufgaben durch einen Klick auf den Button `Aufgabe beanspruchen` für sich reservieren.
- Das Mitglied erledigt diese Aufgabe und markiert mit dem Befehl `/completetask` die Aufgabe als beendet.
- Der Vorstand wird im Channel `#bot-aufgaben` benachrichtigt und kontrolliert sie.
- Der Vorstand entscheidet über das erfolgreiche Beenden der Aufgabe mithilfe der Buttons `Akzeptieren` / `Ablehnen` und schreibt ein kurzes Feedback, welches der Bot dem mitglied privat sendet.

### Punkte für Belohung einlösen

- Das Mitglied kann mit `/rewards` die aktuellen Belohnungen einsehen und eines auswählen.
- Der Vorstand wird im Channel `#bot-belohnungen` benachrichtigt.
- Der Vorstand entscheidet über die Belohnungs-Vergabe mithilfe der Buttons `Akzeptieren` / `Ablehnen`, wonach der Bot das mitglied privat über den Entscheid informiert.
- Der Vorstand verarbeitet die Belohnung und gibt sie dem Mitglied.

---

## 📄 Datenschutz & DSGVO

- Daten werden nur nach Zustimmung gespeichert. (Siehe Channel `#regeln`)
- Mit `/getdata` kannst du deine Daten einsehen.
- Du kannst jederzeit mit `/leave` dem Verein austreten und so deine Daten löschen lassen.
- Die aktuellen Richtlinien zum Verein sind in den Vereinsstatuten und der Datenschutzrichtlinie zu finden

---

## ❓ Hilfe & Support

Du brauchst Hilfe?
Nutze den Befehl `/help` direkt im Discord-Bot-Channel `#bot-befehle` oder stelle deine Frage direkt an ein Vorstandsmitglied.

---

> Letzte Aktualisierung: Mai 2025
> Projekt von Marco Schnider und Vanessa Alves - [GitLab Projektlink](https://gitlab.ost.ch/saba-discord_bot/discord-bot)
