# 💾 Datenbank - Backups & Restore

Das ClansCore-System bietet ein automatisiertes Backup- und Restore-System für die MongoDB-Datenbank.

- **Automatische tägliche Backups**
- **Manuelle Backups via Script**
- **GPG-Verschlüsselung** (optional)
- **Automatische Bereinigung** alter Backups
- **Restore-Funktion** zur Wiederherstellung

---

## Automatisiertes Backup

Ein separater Docker-Service `backup` (siehe `docker-compose.yml`) erzeugt jeden Tag automatisch ein neues Backup der MongoDB-Datenbank.

- Die Backups werden im Ordner `./data/backup/` gespeichert
- Backups älter als 7 Tage werden automatisch gelöscht
- Optional können die Archive per GPG verschlüsselt werden 
    - Setze hierfür in der `.env`-Datei `GPG_PW`

---

## Manuelles Backup mit Script

Falls du ein sofortiges Backup manuell erzeugen willst:

1. Stelle sicher, dass der MongoDB-Container läuft

    ```bash
    docker ps
    ```

2. Führe eines der folgenden Scripts aus:

    - **Windows PowerShell:**

        ```powershell
        powershell -ExecutionPolicy Bypass -File backup/backup.ps1
        ```

        > Hinweis für Windows-Nutzer: Für die Verschlüsselung der Backups wird GPG (GnuPG) benötigt. Lade das Windows-Installationspaket auf der [offiziellen Webseite](https://www.gnupg.org/download/index.html) herunter.

    - **Linux/macOS oder Git Bash/WSL:**

        ```bash
        bash backup/backup.sh
        ```

3. Das Backup wird abgelegt unter:

    ```
    ./data/db-backup/YYYY-MM-DD-HH-MM-SS.tar.gz.gpg
    ```

> Hinweis: Das funktioniert nur, wenn das Volume `./data/db-backup` im `docker-compose.yml` korrekt verbunden ist.

---

## Ablauf

- Backup-Skripte verwenden `mongodump` im Container (via `docker exec`)
- Die Daten werden lokal archiviert (`tar.gz`)
- Optional verschlüsselt (`.gpg`) wenn in der `.env`-Datei `GPG_PW` gesetzt ist
- Temporäre unverschlüsselte Dateien werden nach der Sicherung automatisch gelöscht

---

## Wiederherstellung (manuell)

1. **Restore Script starten**

    ```bash
    bash backup/restore.sh
    ```

    oder unter Windows:

    ```powershell
    powershell -ExecutionPolicy Bypass -File backup/restore.ps1
    ```

2. Folge der Aufforderung und gib den Pfad zur `.tar.gz.gpg` Datei an.

3. Das Script:

    - entschlüsselt die Datei
    - extrahiert sie in `./data/db-restore/`
    - kopiert sie in den Container
    - stellt sie mit `mongorestore --drop` wieder her

---

## Testen

- Backup erstellen:

    ```bash
    bash backup/backup.sh
    ```

- Restore durchführen:

    ```bash
    bash backup/restore.sh
    ```

> Die Wiederhetstellung funktioniert mit allen unterstützten Backup-Formaten (strukturierte Dumps oder `.archive`-basierte Dumps).

---
