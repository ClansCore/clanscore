# 🔌 API-Endpunkte

Vollständige Dokumentation aller REST API-Endpunkte der clanscore-api.

## Base URL

- **Lokal:** `http://localhost:3000/api`
- **Production:** `http://your-server:3000/api` oder `https://your-domain.com/api`

## Authentifizierung

Die meisten Endpunkte erfordern JWT-Authentifizierung. Sende den Token im `Authorization` Header:

```
Authorization: Bearer <jwt-token>
```

## Endpunkte

### Benutzer (Users)

**Base:** `/api/user`

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/` | Alle Benutzer abrufen |
| GET | `/firstUser` | Ersten Benutzer abrufen |
| GET | `/:personId` | Benutzer nach ID abrufen |
| GET | `/by-discord/:discordId` | Benutzer nach Discord ID abrufen |
| GET | `/by-discord/:discordId/data` | Benutzerdaten nach Discord ID abrufen |
| GET | `/by-role/:roleName` | Benutzer nach Rollenname abrufen |
| POST | `/sync` | Benutzer synchronisieren |
| PATCH | `/` | Benutzer speichern |
| PATCH | `/:personId` | Benutzer aktualisieren |
| DELETE | `/:personId` | Benutzer löschen |

**Bewerbungen:**

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/application/temp/by-discord/:discordId` | Temporäre Bewerbungsdaten abrufen |
| PATCH | `/application/temp/by-discord/:discordId` | Temporäre Bewerbungsdaten aktualisieren |
| DELETE | `/application/temp/by-discord/:discordId` | Temporäre Bewerbungsdaten löschen |
| POST | `/:personId/application/accept` | Bewerbung akzeptieren |
| POST | `/:personId/application/deny` | Bewerbung ablehnen |
| GET | `/:personId/application/is-pending` | Prüfen ob Bewerbung aussteht |

**Rollen:**

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/:personId/roles` | Benutzer-Rollen abrufen |
| POST | `/:personId/roles` | Rolle zu Benutzer hinzufügen |
| DELETE | `/:personId/roles/:roleId` | Rolle von Benutzer entfernen |
| PATCH | `/:personId/role-status` | Rollen-Status aktualisieren |

**Punkte:**

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/:personId/points` | Punkte abrufen |
| GET | `/:personId/points/history` | Punkte-Historie abrufen |
| POST | `/:personId/points/increment` | Punkte erhöhen |
| POST | `/:personId/points/decrement` | Punkte verringern |

### Aufgaben (Tasks)

**Base:** `/api/tasks`

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/` | Alle Aufgaben abrufen |
| GET | `/open` | Offene Aufgaben abrufen |
| GET | `/open/:discordId` | Offene Aufgaben für Benutzer |
| GET | `/done` | Erledigte Aufgaben abrufen |
| GET | `/expired` | Abgelaufene Aufgaben abrufen |
| GET | `/tasktypes` | Alle Aufgabentypen abrufen |
| GET | `/:id` | Aufgabe nach ID abrufen |
| POST | `/` | Aufgabe erstellen |
| PATCH | `/:taskId` | Aufgabe aktualisieren |
| DELETE | `/:taskId` | Aufgabe löschen |
| POST | `/:id/claim` | Aufgabe beanspruchen |
| POST | `/:id/complete` | Aufgabe als erledigt markieren |
| POST | `/:id/reward` | Teilnehmer belohnen |
| POST | `/:id/responsible` | Verantwortlichen setzen |
| POST | `/:id/details` | Details setzen |
| POST | `/:id/completed` | Als erledigt markieren |

**Teilnehmer:**

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/:id/participants` | Teilnehmer einer Aufgabe |
| GET | `/participants/:id` | Teilnehmer nach ID |
| POST | `/participants/:id/reset-completed` | Teilnehmer-Status zurücksetzen |

### Rollen (Roles)

**Base:** `/api/roles`

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/` | Alle Rollen abrufen |
| POST | `/` | Rolle erstellen |
| PATCH | `/:roleId` | Rolle aktualisieren |
| DELETE | `/:roleId` | Rolle löschen |
| POST | `/sync` | Rollen synchronisieren |

### Events

**Base:** `/api/events`

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/` | Alle Event-Details abrufen |
| GET | `/upcoming` | Anstehende Events abrufen |
| GET | `/:eventId` | Event-Details nach ID |
| PATCH | `/` | Event-Details aktualisieren |

### Kalender (Calendar)

**Base:** `/api/calendar`

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/info/:guildId` | Kalender-Info abrufen |
| PUT | `/info/:guildId` | Kalender-Info speichern |
| GET | `/link-url` | OAuth-Link generieren |
| GET | `/callback` | OAuth-Callback verarbeiten |
| POST | `/sync` | Kalender synchronisieren |
| POST | `/from-discord/create` | Event von Discord erstellen |
| PATCH | `/from-discord/update` | Event von Discord aktualisieren |
| GET | `/provider-events` | Provider-Events abrufen |
| PATCH | `/info/:guildId/overview-message` | Übersichts-Nachricht speichern |

### Ranglisten (Leaderboards)

**Base:** `/api/leaderboards`

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/` | Alle Ranglisten abrufen |
| POST | `/` | Rangliste erstellen |

### Belohnungen (Rewards)

**Base:** `/api/rewards`

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/` | Alle Belohnungen abrufen |
| POST | `/` | Belohnung erstellen |
| PATCH | `/:rewardId` | Belohnung aktualisieren |
| DELETE | `/:rewardId` | Belohnung löschen |
| POST | `/:id/claim` | Belohnung einfordern |
| POST | `/accept-claim` | Belohnungs-Anforderung akzeptieren |
| POST | `/deny-claim` | Belohnungs-Anforderung ablehnen |

### Spenden (Donations)

**Base:** `/api/donations`

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| POST | `/` | Spende speichern |
| PATCH | `/:id/donor` | Spender aktualisieren |
| GET | `/by-person/:personId` | Spenden nach Person |

### Transaktionen (Transactions)

**Base:** `/api/transactions`

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/` | Alle Transaktionen abrufen |
| GET | `/by-person/:personId` | Transaktionen nach Person |

### Authentifizierung (Auth)

**Base:** `/api/auth`

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| POST | `/login` | Einloggen |
| POST | `/register` | Registrieren |
| GET | `/logout` | Ausloggen |

## Fehlerbehandlung

Alle Endpunkte verwenden ein standardisiertes Fehlerformat:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Fehlerbeschreibung",
    "details": {}
  }
}
```

## Rate Limiting

Aktuell gibt es keine Rate-Limits. Für Production sollten Rate-Limits implementiert werden.

## Weitere Informationen

- [Architektur](architecture.md) - System-Architektur
- [Webhooks](webhooks.md) - Webhook-Integration
- [Konfiguration](../setup.md) - Setup-Anleitung
