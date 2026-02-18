# Logging-Dokumentation

Diese Dokumentation beschreibt das gesamte Logging-System im ClansCore-Projekt, mit besonderem Fokus auf den **bot-log** Channel.
---

## Übersicht

Das ClansCore-Projekt verwendet mehrere Logging-Mechanismen:

1. **Discord bot-log Channel**: Zentraler Log-Channel für wichtige Ereignisse und Änderungen
2. **Console-Logging**: Standard-Logging für Entwicklungs- und Debugging-Zwecke
3. **Error-Handling**: Strukturierte Fehlerbehandlung mit Logging
4. **Webhook-Notifications**: Automatische Benachrichtigungen über API-Webhooks

---

## Der bot-log Channel

### Zweck

Der **bot-log** Channel ist ein Discord-Textkanal, der als zentrales Logging-System für relevante Änderungen und Ereignisse dient. Er befindet sich im **Vorstands-Bereich** des Discord-Servers und ist nur für Vorstandsmitglieder sichtbar.

### Konfiguration

Der Channel-Name ist in `shared/src/channelNames.ts` definiert:

```typescript
export const ChannelNames = {
    // ... andere Channels
    BotLog: "bot-log",
} as const;
```

**Wichtig:** Der Channel muss im Discord-Server mit dem exakten Namen `bot-log` erstellt werden.

### Verwendung

Der bot-log Channel wird verwendet, um folgende Ereignisse zu protokollieren:

- ✅ Rollenänderungen (Dashboard und Discord)
- ✅ User-Synchronisierungen
- ✅ Rollen-Synchronisierungen
- ✅ Spenden-Protokollierung
- ✅ Aufgaben-Erstellung und -Verwaltung
- ✅ Ranglisten-Erstellung
- ✅ Kalender-Synchronisierungen
- ✅ Kalender-Verknüpfungen

---

## Logging-Mechanismen

### 1. Discord Embed-Nachrichten

Die meisten Log-Einträge im bot-log Channel werden als **Discord Embeds** gesendet. Diese bieten strukturierte Informationen mit:

- **Titel**: Beschreibt den Typ des Ereignisses
- **Farbe**: Visuelle Unterscheidung (z.B. grün für Erfolg, orange für Warnung)
- **Felder**: Strukturierte Daten (Benutzer, Änderungen, Details)
- **Timestamp**: Automatische Zeitstempel
- **Footer**: Zusätzliche Metadaten (z.B. Task-ID, Leaderboard-ID)

### Beispiel-Embed-Struktur

```typescript
const logEmbed = new EmbedBuilder()
    .setTitle("🔄 Rollenänderung (Dashboard)")
    .setColor(0x3498db)
    .addFields(
        { name: "Benutzer", value: `<@${discordId}> (${username})`, inline: true },
        { name: "Geändert von", value: changedBy ?? "Dashboard", inline: true },
        { name: "➕ Hinzugefügt", value: addedRoles.join(", "), inline: false },
    )
    .setTimestamp();
```

---

## Verwendung des bot-log Channels

### 1. Rollenänderungen (Dashboard → Discord)

**Datei:** `apps/discord-bot/src/web/routes/webhook.routes.ts`

**Webhook-Endpoint:** `POST /api/notifications/role-changed`

**Ereignis:** Wenn Benutzerrollen im Dashboard geändert werden, wird eine Log-Nachricht gesendet.

**Log-Details:**
- Benutzer (Discord-Mention)
- Geändert von (Admin-Name)
- Hinzugefügte Rollen
- Entfernte Rollen
- Fehler (falls vorhanden)

**Embed-Farbe:** `0x3498db` (Blau)

---

### 2. Rollenaktualisierungen

**Webhook-Endpoint:** `POST /api/notifications/role-updated`

**Ereignis:** Wenn eine Rolle im Dashboard aktualisiert wird (Name, Farbe, etc.).

**Log-Details:**
- Rollenname
- Geändert von
- Liste der Änderungen (Name, Farbe, Hervorheben, Erwähnbar)

**Embed-Farbe:** `0xf39c12` (Orange)

---

### 3. User-Synchronisierung

**Datei:** `apps/discord-bot/src/commands/user/syncusers.ts`

**Befehl:** `/syncusers` (manuell) oder automatisch via Cron-Job

**Ereignis:** Synchronisierung von Discord-Mitgliedern mit der Datenbank.

**Log-Details:**
- Ausgeführt von (Benutzer oder "Automatisch (Cron-Job)")
- Anzahl neue Personen
- Anzahl Wieder-Eintritte
- Anzahl Austritte
- Anzahl Rollenänderungen
- Details der ersten 5 Änderungen
- Warnung bei Verwendung von gecachten Daten

**Embed-Farbe:** `0x9634eb` (Lila)

**Automatische Ausführung:** Täglich um 03:00 Uhr via Cron-Job (`apps/clanscore-api/src/infrastructure/cron/jobs.ts`)

---

### 4. Rollen-Synchronisierung

**Datei:** `apps/discord-bot/src/commands/user/syncroles.ts`

**Befehl:** `/syncroles`

**Ereignis:** Synchronisierung von Discord-Rollen mit der Datenbank.

**Log-Details:**
- Ausgeführt von (Benutzer)
- In DB erstellt (Rollen)
- In DB aktualisiert (Rollen)
- In Discord erstellt (Rollen)
- Fehler (falls vorhanden)

**Embed-Farbe:** `0x9634eb` (Lila)

---

### 5. Spenden-Protokollierung

**Datei:** `apps/discord-bot/src/commands/gamification/donation.ts`

**Befehl:** `/donation`

**Ereignis:** Wenn eine Spende protokolliert und Punkte vergeben werden.

**Log-Details:**
- Spender (Name und Nickname)
- Betrag (CHF)
- Punkte
- Datum
- Protokolliert von (Vorstandsmitglied)
- Interne Notizen

**Embed-Farbe:** `0xff9500` (Orange)

---

### 6. Aufgaben-Erstellung

**Datei:** `apps/discord-bot/src/commands/gamification/task/createTask.ts`

**Befehl:** `/createtask` → Modal → Aufgabe erstellen

**Ereignis:** Wenn eine neue Aufgabe erstellt wird.

**Log-Details:**
- Erstellt von (Benutzer)
- Aufgabenname
- Punkte
- Max. Teilnehmer
- Deadline
- Verantwortlich (wird aktualisiert, wenn zugewiesen)
- Beschreibung

**Embed-Farbe:** `0x2ecc71` (Grün)

**Besonderheit:** Das Log-Embed wird aktualisiert, wenn ein Verantwortlicher zugewiesen wird (durch Suche nach der ursprünglichen Nachricht anhand der Task-ID).

---

### 7. Ranglisten-Erstellung

**Datei:** `apps/discord-bot/src/commands/gamification/createLeaderboard.ts`

**Befehl:** `/createleaderboard`

**Ereignis:** Wenn eine neue Rangliste erstellt wird.

**Log-Details:**
- Erstellt von (Benutzer)
- Ranglistenname
- Startdatum
- Enddatum
- Anzahl sichtbarer Einträge
- Beschreibung

**Embed-Farbe:** `0xffd900` (Gelb)

---

### 8. Kalender-Synchronisierung

**Datei:** `apps/discord-bot/src/commands/events/calendar/synccalendar.ts`

**Befehl:** `/synccalendar`

**Ereignis:** Manuelle Synchronisierung von Google Calendar Events mit Discord.

**Log-Details:**
- Ausgeführt von (Benutzer)
- Anzahl synchronisierte Events
- Anzahl erstellte Events
- Anzahl gelöschte Events

**Embed-Farbe:** `0x34dbca` (Türkis)

---

### 9. Kalender-Verknüpfung

**Datei:** `apps/discord-bot/src/commands/events/calendar/linkcalendar.ts`

**Befehl:** `/linkcalendar`

**Ereignis:** Wenn ein Admin den Prozess zur Verknüpfung eines Google Calendars startet.

**Log-Details:**
- Initiiert von (Benutzer)

**Embed-Farbe:** `0xeb34c6` (Pink)

---

## Dashboard-Logging

### Übersicht

Das **Dashboard** (Angular Frontend) hat **kein eigenes Logging-System** im traditionellen Sinne. Es sendet keine direkten Logs an Discord oder andere externe Systeme. Stattdessen werden Dashboard-Aktionen **indirekt über die API geloggt**, wenn die API entsprechende Webhooks auslöst.

### Architektur

```
Dashboard (Angular) 
    ↓ HTTP Request
API (Express/Node.js)
    ↓ Webhook
Discord-Bot
    ↓ Nachricht
bot-log Channel
```

### Geloggte Dashboard-Aktionen

Die folgenden Dashboard-Aktionen werden im **bot-log** Channel protokolliert:

#### 1. Rollenänderungen an Benutzern

**Dashboard-Aktion:** Benutzer-Rolle hinzufügen oder entfernen

**API-Endpunkt:** 
- `POST /api/user/:personId/role` (Rolle hinzufügen)
- `DELETE /api/user/:personId/role/:roleId` (Rolle entfernen)

**Logging:** 
- ✅ Wird im **bot-log** Channel geloggt
- ✅ Embed mit Benutzer, hinzugefügten/entfernten Rollen, geändert von (Dashboard-Admin)

**Datei:** `apps/clanscore-api/src/presentation/controllers/user.controller.ts`

```typescript
// Beispiel: Rolle hinzufügen
await notificationService.notifyRoleChanged({
    userId: personId,
    platformUserId: personResult.value.discordId,
    username: personResult.value.nickname ?? personResult.value.discordId,
    addedRoles: [roleResult.value.name],
    removedRoles: [],
    changedBy: getChangedByFromRequest(req), // Dashboard-Admin
});
```

#### 2. Rollenaktualisierungen

**Dashboard-Aktion:** Rolle bearbeiten (Name, Farbe, Position, etc.)

**API-Endpunkt:** `PATCH /api/role/:roleId`

**Logging:**
- ✅ Wird im **bot-log** Channel geloggt
- ✅ Embed mit Rollenname, Änderungen (Name, Farbe, Hervorheben, Erwähnbar), geändert von

**Datei:** `apps/clanscore-api/src/presentation/controllers/roles.controller.ts`

```typescript
await notificationService.notifyRoleUpdated({
    roleId: role.id,
    oldName: oldRole.name,
    newName: role.name ?? oldRole.name,
    color: role.discordColor,
    permissions: role.discordPermissions,
    hoist: role.hoist,
    mentionable: role.mentionable,
    changedBy: getChangedByFromRequest(req), // Dashboard-Admin
});
```

### Nicht geloggte Dashboard-Aktionen

Die folgenden Dashboard-Aktionen werden **NICHT** im bot-log Channel protokolliert:

- ❌ **Benutzer erstellen** (`POST /api/user`) - Keine Notification
- ❌ **Benutzer aktualisieren** (`PATCH /api/user/:personId`) - Keine Notification (ausser Rollenänderungen)
- ❌ **Benutzer löschen** (`DELETE /api/user/:personId`) - Keine Notification
- ❌ **Rolle erstellen** (`POST /api/role`) - Keine Notification
- ❌ **Rolle löschen** (`DELETE /api/role/:roleId`) - Keine Notification
- ❌ **Aufgaben verwalten** - Keine Notification
- ❌ **Events verwalten** - Keine Notification
- ❌ **Ranglisten verwalten** - Keine Notification
- ❌ **Spenden verwalten** - Keine Notification
- ❌ **Belohnungen verwalten** - Keine Notification
- ❌ **Passwort ändern** - Keine Notification

**Hinweis:** Diese Aktionen werden nur in der Datenbank gespeichert, aber nicht im Discord bot-log Channel protokolliert.

### Benutzer-Feedback im Dashboard

Das Dashboard verwendet **Angular Material Snackbar** für Benutzer-Feedback:

**Datei:** `apps/dashboard/src/app/app.component.ts`

**Verwendung:**
- ✅ **Passwort-Änderung erfolgreich**: "Ihr Passwort wurde erfolgreich geändert."
- ❌ **Passwort-Änderung fehlgeschlagen**: "Fehler beim Ändern des Passworts: {error}"

**Technische Details:**
```typescript
this.snackBar.open(
    'Ihr Passwort wurde erfolgreich geändert.',
    'Schliessen',
    { duration: 3000 }
);
```

**Wichtig:** Snackbar-Nachrichten sind **nur für den aktuellen Benutzer sichtbar** und werden nicht geloggt.

### Console-Logging im Dashboard

Das Dashboard verwendet **minimales Console-Logging**, hauptsächlich für Debugging-Zwecke:

**Gefundene Console-Logs:**
- `apps/dashboard/src/app/sections/task/components/task-form/task-form.component.ts` - Debug-Ausgabe bei Task-Updates
- `apps/dashboard/src/app/sections/gamification-management/components/task-type-form/task-type-form.component.ts` - Debug-Ausgabe bei Task-Type-Formularen
- `apps/dashboard/src/app/sections/gamification-management/components/jahresplanung-table/jahresplanung-table.component.ts` - Error-Logging bei Validierungsfehlern
- `apps/dashboard/src/app/sections/role/pages/role-page/role-page.component.ts` - Debug-Ausgabe
- `apps/dashboard/src/main.ts` - Error-Logging bei Bootstrap-Fehlern

**Hinweis:** Diese Console-Logs sind nur in der Browser-Konsole sichtbar und werden nicht an externe Systeme gesendet.

### Zusammenfassung Dashboard-Logging

| Aktion | Geloggt? | Wo? | Details |
|--------|----------|-----|---------|
| **Rolle zu Benutzer hinzufügen** | ✅ Ja | bot-log | Embed mit Benutzer, Rolle, geändert von |
| **Rolle von Benutzer entfernen** | ✅ Ja | bot-log | Embed mit Benutzer, Rolle, geändert von |
| **Rolle aktualisieren** | ✅ Ja | bot-log | Embed mit Rollenname, Änderungen, geändert von |
| **Benutzer erstellen** | ❌ Nein | - | Keine Notification |
| **Benutzer aktualisieren** | ❌ Nein | - | Keine Notification (ausser Rollen) |
| **Benutzer löschen** | ❌ Nein | - | Keine Notification |
| **Rolle erstellen** | ❌ Nein | - | Keine Notification |
| **Rolle löschen** | ❌ Nein | - | Keine Notification |
| **Aufgaben/Events/Ranglisten** | ❌ Nein | - | Keine Notification |
| **Passwort ändern** | ❌ Nein | - | Nur Snackbar-Feedback |

### Empfehlungen für zukünftige Entwicklung

Um das Dashboard-Logging zu verbessern, könnten folgende Aktionen zusätzlich geloggt werden:

1. **Benutzer erstellen/aktualisieren/löschen** - Wichtige Änderungen sollten protokolliert werden
2. **Rolle erstellen/löschen** - Neue Rollen sollten im bot-log erscheinen
3. **Aufgaben-Verwaltung** - Erstellung/Bearbeitung von Aufgaben im Dashboard
4. **Events-Verwaltung** - Erstellung/Bearbeitung von Events im Dashboard
5. **Ranglisten-Verwaltung** - Erstellung/Bearbeitung von Ranglisten im Dashboard

**Hinweis:** Diese Erweiterungen würden Änderungen in der API erfordern, um entsprechende Notifications auszulösen.

---

## Console-Logging

### Discord-Bot

**Verwendete Dateien:**
- `apps/discord-bot/src/index.ts`
- `apps/discord-bot/src/discord.handler.ts`
- `apps/discord-bot/src/discord.bot.ts`
- `apps/discord-bot/src/web/server.ts`
- `apps/discord-bot/src/deploy.commands.ts`
- `apps/discord-bot/src/commands/gamification/task/createTask.ts`
- `apps/discord-bot/src/commands/gamification/task/selectTaskTypeModal.ts`
- `apps/discord-bot/src/api/apiClient.ts`
- `apps/discord-bot/src/config.ts`

**Log-Nachrichten:**
- ✅ Bot-Start: `"✅ Discord bot started successfully"`
- ✅ Discord-Client-Verbindung: `"✅ Discord client connected."`
- ✅ Event-Handler-Registrierung: `"✅ Event handlers registered."`
- ✅ Bot-Bereitschaft: `"🤖 Discord-Bot is ready."`
- ✅ Initiale Synchronisierung: `"🔄 Running initial sync..."`
- ✅ Webhook-Server: `"🔔 Bot webhook server listening on http://localhost:${port}"`
- ✅ Commands-Registrierung: `"✅ Commands successfully registered / updated."`
- ⚠️ Fehler: `console.error()` für Fehlerbehandlung

### ClansCore-API

**Verwendete Dateien:**
- `apps/clanscore-api/src/index.ts`
- `apps/clanscore-api/src/infrastructure/database/db.init.ts`
- `apps/clanscore-api/src/infrastructure/cron/jobs.ts`
- `apps/clanscore-api/src/application/notifications/notification.service.ts`
- `apps/clanscore-api/src/config.ts`

**Log-Nachrichten:**
- ✅ Datenbankverbindung: `"✅ Connected to the database"`
- ✅ Datenbank bereits verbunden: `"✅ Already connected to the database"`
- ✅ Server-Start: `"API / OAuth server running at ${url}"`
- ✅ Cron-Jobs: `"✅ Registered all Cron-Jobs"`
- ✅ Notification-Service: `"✅ NotificationService: ${adapter.name} adapter registered"`
- ⚠️ Fehler: Detaillierte Fehlerausgaben bei Datenbankverbindungsfehlern

**Cron-Job-Logging:**
- `"Starte geplante Löschung..."`
- `"Starte User-Synchronisierung..."`

---

## Error-Handling und Logging

### Error-Handling-System

Das Projekt verwendet ein strukturiertes Error-Handling-System über `@clanscore/shared`:

**Datei:** `shared/src/errors/messages.ts`

**Funktion:** `getErrorMessage(error: ErrorDetails): string`

### Error-Typen

Die wichtigsten Error-Typen für Logging:

- `ErrorType.UnknownError`: Unbekannte Fehler
- `ErrorType.MessageNotSend`: Fehler beim Senden von Nachrichten
- `ErrorType.NotificationFailed`: Fehler bei Benachrichtigungen
- `ErrorType.NetworkFailure`: Netzwerkfehler
- `ErrorType.RoleAssignmentFailed`: Fehler bei Rollenzuweisungen

### Fehlerbehandlung im Discord-Bot

**Datei:** `apps/discord-bot/src/errors/dsicordAdapter.ts`

**Funktion:** `replyWithDeferredError()` - Sendet Fehlermeldungen an Benutzer

**Datei:** `apps/discord-bot/src/discord.bot.ts`

**Event-Handler:**
- `client.on("error")` - Loggt Discord-Client-Fehler
- `process.on("unhandledRejection")` - Loggt unbehandelte Promise-Rejections

### Fehlerbehandlung in der API

**Datei:** `apps/clanscore-api/src/presentation/middleware/error.middleware.ts`

**Funktion:** `errorHandler()` - Zentrale Fehlerbehandlung für API-Requests

### Notification-Service Error-Handling

**Datei:** `apps/clanscore-api/src/application/notifications/notification.service.ts`

**Methode:** `broadcast()` - Fängt Fehler in Notification-Adaptern ab und loggt sie

```typescript
catch (error) {
    const errorDetails: ErrorDetails = {
        type: ErrorType.NotificationFailed,
        details: {
            message: `NotificationService: Error in ${adapter.name}.${method}: ${errorMessage}`,
            adapter: adapter.name,
            method: String(method),
        }
    };
    getErrorMessage(errorDetails);
}
```

---

## Webhook-basiertes Logging

### Webhook-Endpunkte

**Datei:** `apps/discord-bot/src/web/routes/webhook.routes.ts`

Die API sendet Webhooks an den Discord-Bot, um Ereignisse zu loggen:

1. **POST `/api/notifications/role-changed`**
   - Loggt Rollenänderungen im bot-log Channel

2. **POST `/api/notifications/role-updated`**
   - Loggt Rollenaktualisierungen im bot-log Channel

3. **POST `/api/notifications/sync-users`**
   - Löst eine User-Synchronisierung aus (wird automatisch geloggt)

### Webhook-Authentifizierung

Alle Webhook-Requests müssen einen gültigen `x-webhook-token` Header enthalten:

```typescript
function verifySecret(req: express.Request): string | boolean {
    const token = req.header("x-webhook-token") ?? "";
    return config.WEBHOOK_SHARED_SECRET && token === config.WEBHOOK_SHARED_SECRET;
}
```

### Webhook-Aufrufe aus der API

**Datei:** `apps/clanscore-api/src/infrastructure/cron/jobs.ts`

Automatische User-Synchronisierung via Webhook:

```typescript
const response = await fetch(`${config.DISCORD_BOT_WEBHOOK_URL}/api/notifications/sync-users`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-webhook-token": config.WEBHOOK_SHARED_SECRET,
    },
    body: JSON.stringify({
        guildId: config.DISCORD_GUILD_ID,
    }),
});
```

---

## Konfiguration

### Umgebungsvariablen

**Discord-Bot:**
- `DISCORD_GUILD_ID`: Discord Server ID
- `WEBHOOK_SHARED_SECRET`: Shared Secret für Webhook-Authentifizierung

**ClansCore-API:**
- `DISCORD_BOT_WEBHOOK_URL`: URL des Discord-Bot Webhook-Servers
- `WEBHOOK_SHARED_SECRET`: Shared Secret für Webhook-Authentifizierung
- `DISCORD_GUILD_ID`: Discord Server ID

### Channel-Setup

Der `bot-log` Channel muss im Discord-Server erstellt werden:

1. **Channel-Name:** `bot-log` (exakt, case-sensitive)
2. **Bereich:** Vorstands-Bereich (nur für Vorstandsmitglieder sichtbar)
3. **Typ:** Text-Channel
4. **Berechtigungen:** Bot benötigt `Send Messages` und `Embed Links`

### Docker-Logging

**Datei:** `docker-compose.yml` (falls vorhanden)

Logs können über Docker Compose angezeigt werden:

```bash
# Alle Services
docker-compose logs -f

# Einzelner Service
docker-compose logs -f discord-bot
docker-compose logs -f clanscore-api
```

---

## Ephemeral Messages - Direkte Benutzerinformationen

### Was sind Ephemeral Messages?

**Ephemeral Messages** sind private Nachrichten, die nur für den ausführenden Benutzer sichtbar sind. Diese werden direkt als Antwort auf Discord-Befehle gesendet und verschwinden nicht automatisch, bleiben aber für andere Server-Mitglieder unsichtbar.

### Verwendung im ClansCore-Projekt

Fast alle Discord-Befehle verwenden Ephemeral Messages, um Benutzer direkt zu informieren:

**Technische Implementierung:**
```typescript
await interaction.deferReply({ flags: MessageFlags.Ephemeral });
// oder
await interaction.reply({ 
    content: "Nachricht", 
    flags: MessageFlags.Ephemeral 
});
```

### Befehle mit Ephemeral Messages

**Alle folgenden Befehle senden Ephemeral Messages an den ausführenden Benutzer:**

1. **`/syncusers`** - Zeigt Synchronisierungs-Ergebnisse (neue Benutzer, Änderungen, etc.)
2. **`/syncroles`** - Zeigt Rollen-Synchronisierungs-Ergebnisse
3. **`/donation`** - Bestätigt Spenden-Protokollierung
4. **`/createtask`** - Bestätigt Aufgaben-Erstellung und zeigt Konfigurationsoptionen
5. **`/createleaderboard`** - Bestätigt Ranglisten-Erstellung
6. **`/synccalendar`** - Zeigt Synchronisierungs-Statistiken
7. **`/linkcalendar`** - Zeigt Link zur Kalender-Verknüpfung
8. **`/claim`** - Bestätigt Aufgaben-Übernahme
9. **`/task-complete`** - Bestätigt Aufgaben-Abschluss
10. **`/rewards`** - Zeigt verfügbare Belohnungen
11. **`/join`** - Zeigt Bewerbungsstatus
12. **`/leave`** - Bestätigt Austrittsanfrage
13. **`/getdata`** - Zeigt persönliche Daten
14. **`/score`** - Zeigt persönlichen Punktestand
15. **`/events`** - Zeigt Event-Informationen
16. **`/help`** - Zeigt Hilfe-Informationen
17. **`/ping`** - Zeigt Bot-Latenz

### Fehlermeldungen als Ephemeral Messages

Alle Fehlermeldungen werden ebenfalls als Ephemeral Messages gesendet, sodass nur der betroffene Benutzer die Fehlerinformationen sieht:

**Datei:** `apps/discord-bot/src/errors/dsicordAdapter.ts`

```typescript
export async function replyWithError(
    interaction: CommandInteraction | ModalSubmitInteraction | ...,
    error: ErrorDetails,
) {
    return await interaction.reply({
        content: getErrorMessage(error),
        flags: MessageFlags.Ephemeral,
    });
}
```

### Vorteile von Ephemeral Messages

- ✅ **Privatsphäre**: Sensible Informationen (z.B. persönliche Daten) bleiben privat
- ✅ **Keine Channel-Verschmutzung**: Erfolgs- und Fehlermeldungen erscheinen nicht in öffentlichen Channels
- ✅ **Bessere UX**: Benutzer erhalten sofortiges Feedback zu ihren Aktionen
- ✅ **Fehlerbehandlung**: Fehlermeldungen werden nur dem betroffenen Benutzer angezeigt

---

## Nachrichten in anderen Bot-Channels

Nicht alle Bot-Nachrichten landen im **bot-log** Channel. Viele Nachrichten werden in spezialisierten Channels für bestimmte Zwecke gesendet:

### 1. Channel: `aufgaben` (TASKS)

**Zweck:** Veröffentlichung von Aufgaben für alle Mitglieder

**Nachrichten:**
- ✅ **Aufgaben-Veröffentlichung**: Wenn eine Aufgabe mit `/createtask` erstellt und veröffentlicht wird, erscheint sie hier als Embed mit:
  - Aufgabenname
  - Beschreibung
  - Punkte
  - Maximale Teilnehmer
  - Deadline
  - Verknüpftes Event (falls vorhanden)
  - Button "Aufgabe beanspruchen"

**Datei:** `apps/discord-bot/src/commands/gamification/task/createTask.ts` (handlePublishTask)

**Hinweis:** Die Erstellung der Aufgabe wird im **bot-log** geloggt, die Veröffentlichung erfolgt im **aufgaben** Channel.

---

### 2. Channel: `events` (EVENTS)

**Zweck:** Event-Übersicht und Event-Benachrichtigungen

**Nachrichten:**
- ✅ **Event-Übersicht**: Automatische Übersicht der nächsten 5 Events (wird regelmässig aktualisiert)
- ✅ **Event-Benachrichtigungen**: Benachrichtigungen für anstehende Events mit:
  - Event-Name
  - Datum und Uhrzeit
  - Beschreibung
  - Teilnehmer-Mentions
  - Relative Zeitangabe (z.B. "in 2 Stunden")

**Datei:** 
- `apps/discord-bot/src/intergration/event/event-discord.service.ts` (sendEventOverviewToChannel)
- `apps/discord-bot/src/utils-discord/guild.ts` (notifyEvent)

**Aktualisierung:** Die Event-Übersicht wird automatisch aktualisiert, wenn Events synchronisiert werden.

---

### 3. Channel: `rangliste` (LEADERBOARDS)

**Zweck:** Anzeige aktiver Ranglisten

**Nachrichten:**
- ✅ **Ranglisten-Embed**: Zeigt alle aktiven Ranglisten mit:
  - Top-Teilnehmer (nach Anzahl sichtbarer Einträge)
  - Punkte pro Teilnehmer
  - Zeitraum (Start- und Enddatum)
  - Gewinner-Embed (falls vorhanden)

**Datei:** `apps/discord-bot/src/intergration/leaderboard-discord.service.ts` (updateLeaderboards)

**Aktualisierung:** Wird automatisch aktualisiert, wenn:
- Punkte vergeben werden (Aufgaben, Spenden, Events)
- Neue Ranglisten erstellt werden
- Belohnungen akzeptiert werden

**Hinweis:** Die Erstellung einer Rangliste wird im **bot-log** geloggt, die Anzeige erfolgt im **rangliste** Channel.

---

### 4. Channel: `bot-bewerbungen` (APPLICATIONS)

**Zweck:** Vorstands-Bereich für Bewerbungen und Austritte

**Nachrichten:**
- ✅ **Neue Bewerbungen**: Wenn ein Benutzer `/join` ausführt, erscheint hier ein Embed mit:
  - Benutzerinformationen (Name, Discord-ID, etc.)
  - Bewerbungsdaten
  - Buttons "Akzeptieren" und "Ablehnen"
- ✅ **Austrittsanfragen**: Wenn ein Benutzer `/leave` ausführt, erscheint hier eine Nachricht

**Datei:**
- `apps/discord-bot/src/commands/user/join/joinStep2.ts` (Bewerbungen)
- `apps/discord-bot/src/commands/user/leave.ts` (Austritte)
- `apps/discord-bot/src/intergration/user-discord.service.ts` (handleGuildMemberAdd)

**Zugriff:** Nur für Vorstandsmitglieder sichtbar

---

### 5. Channel: `bot-belohnungen` (REWARDS)

**Zweck:** Vorstands-Bereich für Belohnungsanfragen

**Nachrichten:**
- ✅ **Belohnungsanfragen**: Wenn ein Benutzer eine Belohnung mit `/rewards` anfordert, erscheint hier ein Embed mit:
  - Benutzerinformationen
  - Belohnungsname
  - Kosten (Punkte)
  - Buttons "Akzeptieren" und "Ablehnen"

**Datei:** `apps/discord-bot/src/commands/gamification/rewards.ts` (processReward)

**Zugriff:** Nur für Vorstandsmitglieder sichtbar

---

### 6. Channel: `bot-aufgaben` (COMPLETED_TASKS)

**Zweck:** Vorstands-Bereich für erledigte Aufgaben

**Nachrichten:**
- ✅ **Erledigte Aufgaben**: Wenn ein Benutzer eine Aufgabe mit `/task-complete` abschliesst, erscheint hier ein Embed mit:
  - Aufgabenname
  - Benutzer, der die Aufgabe erledigt hat
  - Punkte
  - Buttons "Akzeptieren" und "Ablehnen"
  - Feedback-Feld (wenn vom Vorstand ausgefüllt)

**Datei:** `apps/discord-bot/src/commands/gamification/task/feedback.ts` (processTaskCompletionButton)

**Zugriff:** Nur für Vorstandsmitglieder sichtbar

**Workflow:**
1. Benutzer erledigt Aufgabe → Nachricht erscheint in `bot-aufgaben`
2. Vorstand gibt Feedback (optional) und akzeptiert/lehnt ab
3. Benutzer erhält DM mit Feedback und Punkte (falls akzeptiert)

---

## Übersicht: Channel-Zuordnung

| Channel | Zweck | Sichtbarkeit | Nachrichten-Typ |
|---------|-------|--------------|-----------------|
| **bot-log** | Logging wichtiger Ereignisse | Vorstand | Log-Embeds (9 Event-Typen) |
| **aufgaben** | Aufgaben-Veröffentlichung | Alle Mitglieder | Aufgaben-Embeds mit Claim-Button |
| **events** | Event-Übersicht & Benachrichtigungen | Alle Mitglieder | Event-Embeds & Übersicht |
| **rangliste** | Ranglisten-Anzeige | Alle Mitglieder | Ranglisten-Embeds |
| **bot-bewerbungen** | Bewerbungen & Austritte | Vorstand | Bewerbungs-Embeds mit Buttons |
| **bot-belohnungen** | Belohnungsanfragen | Vorstand | Belohnungs-Embeds mit Buttons |
| **bot-aufgaben** | Erledigte Aufgaben | Vorstand | Aufgaben-Abschluss-Embeds mit Buttons |

---

## Zusammenfassung

Das Logging-System im ClansCore-Projekt besteht aus:

1. **bot-log Channel**: Zentraler Discord-Channel für wichtige Ereignisse und Änderungen (9 Event-Typen)
2. **Ephemeral Messages**: Private Nachrichten direkt an Benutzer bei Befehlen (17+ Befehle)
3. **Spezialisierte Channels**: 6 weitere Channels für spezifische Zwecke (Aufgaben, Events, Ranglisten, Bewerbungen, Belohnungen, erledigte Aufgaben)
4. **Console-Logging**: Entwicklungs- und Debugging-Logs in beiden Services
5. **Error-Handling**: Strukturierte Fehlerbehandlung mit zentraler Fehlermeldungsverarbeitung
6. **Webhook-System**: Automatische Benachrichtigungen zwischen API und Discord-Bot

**Wichtigste Logging-Punkte:**
- ✅ Alle Rollenänderungen (Dashboard und Discord) → **bot-log**
- ✅ User- und Rollen-Synchronisierungen → **bot-log** + Ephemeral Messages
- ✅ Spenden-Protokollierung → **bot-log** + Ephemeral Messages
- ✅ Aufgaben-Erstellung → **bot-log**, Aufgaben-Veröffentlichung → **aufgaben**
- ✅ Ranglisten-Erstellung → **bot-log**, Ranglisten-Anzeige → **rangliste**
- ✅ Kalender-Synchronisierungen → **bot-log** + Ephemeral Messages
- ✅ Automatische Cron-Job-Ausführungen → **bot-log**

**Benutzerinformationen:**
- ✅ Alle Befehlsantworten → **Ephemeral Messages** (nur für ausführenden Benutzer sichtbar)
- ✅ Fehlermeldungen → **Ephemeral Messages** (privat)
- ✅ Erfolgsmeldungen → **Ephemeral Messages** (privat)

Alle Log-Einträge im bot-log Channel sind als strukturierte Discord Embeds formatiert und enthalten relevante Metadaten für die Nachverfolgung von Änderungen.
