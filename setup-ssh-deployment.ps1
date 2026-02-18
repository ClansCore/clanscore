# Setup-Skript für SSH-basiertes Deployment (PowerShell)
# Dieses Skript hilft beim Einrichten des SSH-Keys für GitHub Actions

Write-Host "SSH Deployment Setup für GitHub Actions" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# SSH-Key Pfad
$SSH_KEY_PATH = "$env:USERPROFILE\.ssh\github_actions_deploy"

# Prüfen ob SSH-Key bereits existiert
if (Test-Path $SSH_KEY_PATH) {
    Write-Host "SSH-Key existiert bereits: $SSH_KEY_PATH" -ForegroundColor Yellow
    $response = Read-Host "Möchten Sie einen neuen Key erstellen? (j/n)"
    if ($response -match "^[JjYy]$") {
        Remove-Item $SSH_KEY_PATH -ErrorAction SilentlyContinue
        Remove-Item "$SSH_KEY_PATH.pub" -ErrorAction SilentlyContinue
    } else {
        Write-Host "Verwende bestehenden Key..." -ForegroundColor Yellow
    }
}

# SSH-Key erstellen falls nicht vorhanden
if (-not (Test-Path $SSH_KEY_PATH)) {
    Write-Host "🔑 Erstelle neuen SSH-Key..." -ForegroundColor Cyan
    
    # Prüfen ob ssh-keygen verfügbar ist
    try {
        ssh-keygen -t ed25519 -C "github-actions-deploy" -f $SSH_KEY_PATH -N '""' 2>&1 | Out-Null
        Write-Host "SSH-Key erstellt" -ForegroundColor Green
    } catch {
        Write-Host "Fehler beim Erstellen des SSH-Keys" -ForegroundColor Red
        Write-Host "Stellen Sie sicher, dass OpenSSH installiert ist." -ForegroundColor Yellow
        exit 1
    }
}

# Öffentlichen Key anzeigen
Write-Host ""
Write-Host "Öffentlicher SSH-Key (kopieren Sie diesen auf Ihren Server):" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Get-Content "$SSH_KEY_PATH.pub"
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Server-Informationen abfragen
$SERVER_HOST = Read-Host "Server IP oder Hostname"
$SERVER_USER = Read-Host "SSH Benutzername"
$SERVER_PORT_STR = Read-Host "SSH Port (Standard: 22)"
$SERVER_PORT = if ($SERVER_PORT_STR) { $SERVER_PORT_STR } else { "22" }

Write-Host ""
Write-Host "Installiere SSH-Key auf Server..." -ForegroundColor Cyan
Write-Host "Sie müssen den öffentlichen Key manuell auf den Server kopieren." -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Kopieren Sie den öffentlichen Key oben" -ForegroundColor Yellow
Write-Host "2. Verbinden Sie sich mit dem Server:" -ForegroundColor Yellow
Write-Host "   ssh $SERVER_USER@$SERVER_HOST -p $SERVER_PORT" -ForegroundColor White
Write-Host "3. Führen Sie auf dem Server aus:" -ForegroundColor Yellow
Write-Host "   mkdir -p ~/.ssh" -ForegroundColor White
Write-Host "   chmod 700 ~/.ssh" -ForegroundColor White
Write-Host "   echo 'IHR_PUBLIC_KEY_HIER' >> ~/.ssh/authorized_keys" -ForegroundColor White
Write-Host "   chmod 600 ~/.ssh/authorized_keys" -ForegroundColor White
Write-Host ""

# Verbindung testen
Write-Host ""
Write-Host "Teste SSH-Verbindung..." -ForegroundColor Cyan
$testResult = ssh -i $SSH_KEY_PATH -p $SERVER_PORT -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "echo 'SSH-Verbindung erfolgreich!'" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "SSH-Verbindung erfolgreich!" -ForegroundColor Green
} else {
    Write-Host "SSH-Verbindung fehlgeschlagen!" -ForegroundColor Red
    Write-Host "Bitte prüfen Sie:" -ForegroundColor Yellow
    Write-Host "  - Server ist erreichbar" -ForegroundColor Yellow
    Write-Host "  - SSH-Key wurde korrekt installiert" -ForegroundColor Yellow
    Write-Host "  - Firewall erlaubt SSH-Verbindungen" -ForegroundColor Yellow
}

# Privaten Key anzeigen
Write-Host ""
Write-Host "Privater SSH-Key für GitHub Secrets:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Kopieren Sie den kompletten Inhalt (inkl. BEGIN/END Zeilen):" -ForegroundColor Yellow
Write-Host ""
Get-Content $SSH_KEY_PATH
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Zusammenfassung
Write-Host ""
Write-Host "Setup abgeschlossen!" -ForegroundColor Green
Write-Host ""
Write-Host "Nächste Schritte:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. GitHub Secrets konfigurieren:" -ForegroundColor Yellow
Write-Host "   - Gehen Sie zu: Settings → Secrets and variables → Actions" -ForegroundColor White
Write-Host "   - Fügen Sie folgende Secrets hinzu:" -ForegroundColor White
Write-Host ""
Write-Host "   SERVER_HOST=$SERVER_HOST" -ForegroundColor White
Write-Host "   SERVER_USER=$SERVER_USER" -ForegroundColor White
if ($SERVER_PORT -ne "22") {
    Write-Host "   SERVER_SSH_PORT=$SERVER_PORT" -ForegroundColor White
}
Write-Host "   SERVER_SSH_KEY=<Privater Key von oben>" -ForegroundColor White
Write-Host ""
Write-Host "2. Alle anderen Secrets aus .env.example hinzufügen" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Workflow testen:" -ForegroundColor Yellow
Write-Host "   - Gehen Sie zu: Actions → Deploy to Server → Run workflow" -ForegroundColor White
Write-Host ""
