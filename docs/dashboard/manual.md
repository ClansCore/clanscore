# 📊 Dashboard - Benutzerhandbuch

Vollständiges Handbuch für das ClansCore Dashboard.

---

## 📊 Was ist das Dashboard?

Das ClansCore-Dashboard ist eine moderne Webanwendung zur Verwaltung des Vereins. Es bietet Administratoren und Vorstandsmitgliedern eine intuitive Benutzeroberfläche und ermöglicht in Verbindung mit dem Discord-Bot die Durchführung sämtlicher Verwaltungsaufgaben.


## ✨ Übersicht Funktionen

- Benutzer-Verwaltung
    - Mitglieder-Verwaltung
    - Rollen-Verwaltung
    - Rollen zuweisen

- Aufgaben- und Event-Ansicht

- Gamification
    - Ranglisten einsehen
    - Punkte-Historie von Mitgliedern anzeigen
    - Gamification-Parameter Verwalten
    - Aufgabentypen Verwalten 
    - Belohnungen verwalten
    - Jahresplanung vom Gamification-System Erstellen

- Admin-Login
    - Mitglieder-Verwaltung
    - Passwort-Setzung

---

## 👥 Zielgruppe

- **Vorstandsmitglieder:** für Verwaltungsaufgaben

---

## 🔐 Anmeldung

### Erste Anmeldung

1. Öffne das Dashboard
2. Melde dich mit dem Administrator-Account an
3. Erstelle ein neues Mitglied mit der Rolle Vorstand
4. Setze ein Passwort für das neu erstellte Mitglied
5. Melde dich aus dem Administrator-Account ab
6. Anschliessend kannst du dich mit dem neu erstellten Account anmelden

### Einloggen

1. Gib deine Anmeldedaten ein
2. Klicke auf "Anmelden"
3. Du wirst zum Dashboard weitergeleitet

## ⚙️ Hauptfunktionen

### Mitglieder-Verwaltung

**Aktionen:**

- **Mitglied hinzufügen:**  Formular ausfüllen und absenden
- **Mitglied bearbeiten:** Daten abändern und absenden 
- **Mitglied löschen:** Auf das Lösch-Icon klicken und bestätigen
- **Rollen zuweisen:** Benutzer bearbeiten → Rollen hinzufügen/entfernen

### Rollen-Verwaltung

**Aktionen:**

- **Rollen hinzufügen:**  Formular ausfüllen und absenden
- **Rollen bearbeiten:** Daten abändern und absenden 
- **Rollen löschen:** Auf das Lösch-Icon klicken und bestätigen

### Ranglisten

**Ranglisten anzeigen:**
- Filter um gewünschte Rangliste anzuzeigen

**Punkte-Historie anzeigen:**
- Filter um gewünschtes Mitglied auszuwählen

### Gamification-Verwaltung

- Gamifcation-Parameter erfassen/bearbeiten

**Aufgabentypen verwalten:**
- Aufgabentypen erstellen
- Aufgabentypen bearbeiten
- Aufgabentypen löschen


**Belohnungen verwalten:**

- Belohnungen erstellen
- Belohnungen bearbeiten
- Belohnungen löschen

**Jahresplanung der Punktevergabe vom Verein:**
- Erfassung der Anzahl und Menge der Aufgabentypen
- Erfassung der Spendensumme
- Berechnung und Anzeige der voraussichtlich im Jahr vergebenen Punkte des Vereins

**Punktebeispiel:**
- Eingabe der voraussichtlich erledigten Aufgaben und Spenden des Mitglieds
- Berechnung und Anzeige der voraussichtlich im Jahr erzielten Punkte des Mitglieds



## 🗺️ Navigation

### Hauptmenü

- **Mitglieder:** Benutzer-Verwaltung
- **Aufgaben:** Aufgaben-Management
- **Ranglisten:** Ranglisten und Punkte-Historie von Benutzern einsehen
- **Events:** Event-Liste
- **Rollen:** Rollen-Verwaltung
- **Belohnungen:** Belohnungen-Verwaltung

**Gamification-Verwaltung**:
- **Punkte:** Gamification-Paramter und Aufgabentypen verwalten
- **Jahresplanung:** Die Punktevergabe für das Jahr planen
- **Belohnungen:** Belohnungs-Verwaltung
- **Punktebeispiel:** Punktebeispiel für ein Jahr von einem Mitglied Erstellen

### Benutzer-Menü
- **Passwort Ändern:** Das eigene Passwort Ändern

## 🔒 Berechtigungen

### Rollen

| Rolle | Berechtigungen |
|-------|----------------|
| **Vorstand** | Alle Funktionen bis auf Passwort Änderung |
| **Admin** | Benutzerverwaltung und Passwort Änderung |

---
## 💻 Technologie

- **Framework:** Angular 18
- **Sprache:** TypeScript
- **Styling:** SCSS
- **Build:** Angular CLI
---

## 📚 Weitere Informationen

- [API-Endpunkte](../configuration/development/api-endpoints.md) - Vollständige API-Dokumentation
- [Konfiguration](../configuration/setup.md) - Setup-Anleitung
- [Discord Bot](../bot/manual.md) - Bot-Funktionen

---
