#!/bin/bash

# Setup-Skript für SSH-basiertes Deployment
# Dieses Skript hilft beim Einrichten des SSH-Keys für GitHub Actions

set -e

echo "SSH Deployment Setup für GitHub Actions"
echo "============================================"
echo ""

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Prüfen ob SSH-Key bereits existiert
SSH_KEY_PATH="$HOME/.ssh/github_actions_deploy"
if [ -f "$SSH_KEY_PATH" ]; then
    echo -e "${YELLOW}SSH-Key existiert bereits: $SSH_KEY_PATH${NC}"
    read -p "Möchten Sie einen neuen Key erstellen? (j/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[JjYy]$ ]]; then
        echo "Verwende bestehenden Key..."
    else
        rm -f "$SSH_KEY_PATH" "$SSH_KEY_PATH.pub"
    fi
fi

# SSH-Key erstellen falls nicht vorhanden
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "Erstelle neuen SSH-Key..."
    ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$SSH_KEY_PATH" -N ""
    echo -e "${GREEN}SSH-Key erstellt${NC}"
fi

# Öffentlichen Key anzeigen
echo ""
echo "Öffentlicher SSH-Key (kopieren Sie diesen auf Ihren Server):"
echo "============================================"
cat "$SSH_KEY_PATH.pub"
echo ""
echo "============================================"
echo ""

# Server-Informationen abfragen
read -p "Server IP oder Hostname: " SERVER_HOST
read -p "SSH Benutzername: " SERVER_USER
read -p "SSH Port (Standard: 22): " SERVER_PORT
SERVER_PORT=${SERVER_PORT:-22}

echo ""
echo "Installiere SSH-Key auf Server..."
echo "Sie werden nach dem Server-Passwort gefragt."

# Key auf Server kopieren
ssh-copy-id -i "$SSH_KEY_PATH.pub" -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" || {
    echo -e "${YELLOW}ssh-copy-id fehlgeschlagen. Manuelle Installation:${NC}"
    echo ""
    echo "1. Kopieren Sie den öffentlichen Key oben"
    echo "2. Verbinden Sie sich mit dem Server:"
    echo "   ssh $SERVER_USER@$SERVER_HOST -p $SERVER_PORT"
    echo "3. Führen Sie auf dem Server aus:"
    echo "   mkdir -p ~/.ssh"
    echo "   chmod 700 ~/.ssh"
    echo "   echo 'IHR_PUBLIC_KEY_HIER' >> ~/.ssh/authorized_keys"
    echo "   chmod 600 ~/.ssh/authorized_keys"
    echo ""
}

# Verbindung testen
echo ""
echo "Teste SSH-Verbindung..."
if ssh -i "$SSH_KEY_PATH" -p "$SERVER_PORT" -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "echo 'SSH-Verbindung erfolgreich!'" 2>/dev/null; then
    echo -e "${GREEN}SSH-Verbindung erfolgreich!${NC}"
else
    echo -e "${RED}SSH-Verbindung fehlgeschlagen!${NC}"
    echo "Bitte prüfen Sie:"
    echo "  - Server ist erreichbar"
    echo "  - SSH-Key wurde korrekt installiert"
    echo "  - Firewall erlaubt SSH-Verbindungen"
    exit 1
fi

# Privaten Key anzeigen
echo ""
echo "Privater SSH-Key für GitHub Secrets:"
echo "============================================"
echo "Kopieren Sie den kompletten Inhalt (inkl. BEGIN/END Zeilen):"
echo ""
cat "$SSH_KEY_PATH"
echo ""
echo "============================================"
echo ""

# Zusammenfassung
echo ""
echo -e "${GREEN}Setup abgeschlossen!${NC}"
echo ""
echo "Nächste Schritte:"
echo ""
echo "1. GitHub Secrets konfigurieren:"
echo "   - Gehen Sie zu: Settings → Secrets and variables → Actions"
echo "   - Fügen Sie folgende Secrets hinzu:"
echo ""
echo "   SERVER_HOST=$SERVER_HOST"
echo "   SERVER_USER=$SERVER_USER"
if [ "$SERVER_PORT" != "22" ]; then
    echo "   SERVER_SSH_PORT=$SERVER_PORT"
fi
echo "   SERVER_SSH_KEY=<Privater Key von oben>"
echo ""
echo "2. Alle anderen Secrets aus .env.example hinzufügen"
echo ""
echo "3. Workflow testen:"
echo "   - Gehen Sie zu: Actions → Deploy to Server → Run workflow"
echo ""
