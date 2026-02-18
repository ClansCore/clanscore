# 🔐 SSH-Setup für Passwort-Authentifizierung

## Option 1: Passwort-basiertes Deployment (Einfach, aber weniger sicher)

### GitHub Secrets konfigurieren

Für Passwort-Authentifizierung benötigst du:

1. **`SERVER_HOST`** = `<server_host>` (z.B. `srbsci-11.ost.ch` oder `152.96.10.11`)
2. **`SERVER_USER`** = `<server_benutzer>` (z.B. `ins`, `ubuntu`, `root`, `deploy`)
3. **`SERVER_SSH_PASSWORD`** = SSH-Passwort
4. **`SERVER_SSH_PORT`** = `22` (optional, falls Standard)

### Workflow verwenden

Verwende `.github/workflows/deploy-password.yml` statt `deploy.yml`, oder aktualisiere `deploy.yml` (siehe unten).

---

## Option 2: SSH-Key einrichten (Empfohlen, sicherer)

### Warum SSH-Key?

- Sicherer (kein Passwort in GitHub Secrets)
- Automatisches Login ohne Passwort-Eingabe
- Standard für CI/CD

### Automatisches Setup (Empfohlen)

**Windows (PowerShell):**
```powershell
.\setup-ssh-deployment.ps1
```

**Linux/macOS (Bash):**
```bash
./setup-ssh-deployment.sh
```

Das Skript führt durch:

1. SSH-Key-Erstellung
2. Anzeige des öffentlichen Keys (für Server-Installation)
3. Anzeige des privaten Keys (für GitHub Secrets)
4. SSH-Verbindungstest
5. Anweisungen für GitHub Secrets

**Nach dem Skript:**
- Kopiere den öffentlichen Key auf den Server (siehe Anweisungen im Skript)
- Kopiere den privaten Key in GitHub Secrets als `SERVER_SSH_KEY`
- Füge `SERVER_HOST`, `SERVER_USER` und optional `SERVER_SSH_PORT` hinzu

---

## Manuelles Setup (Alternative)

Falls du die Schritte manuell durchführen möchtest:

### Schritt 1: SSH-Key erstellen (lokal)

```bash
# Auf dem lokalen Rechner
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Kein Passwort eingeben (Enter drücken)
```

### Schritt 2: Öffentlichen Key auf Server installieren

**Methode A: Automatisch (empfohlen)**
```bash
# Auf dem lokalen Rechner
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub <server_benutzer>@<server_host>
# Passwort eingeben, wenn gefragt
```

**Methode B: Manuell**
```bash
# 1. Öffentlichen Key anzeigen (lokal)
cat ~/.ssh/github_actions_deploy.pub

# 2. Auf Server einloggen
ssh <server_benutzer>@<server_host>

# 3. Auf Server: Key hinzufügen
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Key einfügen (aus Schritt 1)
chmod 600 ~/.ssh/authorized_keys
```

### Schritt 3: SSH-Key-Verbindung testen

```bash
# Sollte ohne Passwort funktionieren
ssh -i ~/.ssh/github_actions_deploy <server_benutzer>@<server_host>
```

### Schritt 4: GitHub Secrets konfigurieren

1. **`SERVER_HOST`** = `<server_host>` (z.B. `srbsci-11.ost.ch` oder `152.96.10.11`)
2. **`SERVER_USER`** = `<server_benutzer>` (z.B. `ins`, `ubuntu`, `root`, `deploy`)
3. **`SERVER_SSH_KEY`** = Privater Key (komplett):
   ```bash
   cat ~/.ssh/github_actions_deploy
   # Kompletten Inhalt kopieren (inkl. BEGIN/END Zeilen)
   ```
4. **`SERVER_SSH_PORT`** = `22` (optional)

### Schritt 5: Workflow verwenden

Verwende `.github/workflows/deploy.yml` (Key-basiert).

---

## Vergleich

| Methode | Sicherheit | Einfachheit | Empfohlen |
|---------|-----------|-------------|-----------|
| Passwort | ⚠️ Niedrig | ✅ Sehr einfach | ❌ Nein |
| SSH-Key (manuell) | ✅ Hoch | ⚠️ Mittel | ⚠️ Ja, wenn kein Skript |
| SSH-Key (mit Skript) | ✅ Hoch | ✅ Sehr einfach | ✅ Ja |

---

## Troubleshooting

- "Permission denied (publickey)"

    **Bei Passwort-Auth:**
    - Prüfe `SERVER_SSH_PASSWORD`
    - Prüfe, ob Passwort-Auth auf Server erlaubt ist:
    ```bash
    # Auf Server
    sudo nano /etc/ssh/sshd_config
    # Sollte enthalten: PasswordAuthentication yes
    sudo systemctl restart sshd
    ```

    **Bei Key-Auth:**
    - Prüfe, ob öffentlicher Key auf Server installiert ist
    - Prüfe Berechtigungen: `chmod 600 ~/.ssh/authorized_keys`

- "Connection refused"

    - Prüfe `SERVER_HOST` und `SERVER_SSH_PORT`
    - Prüfe Firewall-Einstellungen
    - Teste: `ssh <server_benutzer>@<server_host>`

## Nächste Schritte

Nach dem Setup:

1. GitHub Secrets konfigurieren
2. Workflow testen (Actions → Deploy to Server → Run workflow)
3. Logs prüfen

**Tipp:** Verwende `setup-ssh-deployment.ps1` (Windows) oder `setup-ssh-deployment.sh` (Linux/macOS) für ein automatisiertes Setup!

Siehe [GitHub Secrets Guide](secrets-env/github-secrets.md) für alle benötigten Secrets.

---
