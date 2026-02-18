#!/bin/bash

# ClansCore Deployment Script
# Dieses Skript erleichtert das Deployment aller Services

echo "Clanscore Deployment Script"
echo "================================"

# Prüfen ob .env existiert
if [ ! -f .env ]; then
    echo ".env Datei nicht gefunden!"
    echo "Erstelle .env aus .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo ".env erstellt. Bitte konfigurieren Sie die Variablen!"
        echo "Öffnen Sie .env und passen Sie die Werte an."
        exit 1
    else
        echo ".env.example nicht gefunden!"
        exit 1
    fi
fi

# Docker prüfen
if ! command -v docker &> /dev/null; then
    echo "Docker ist nicht installiert oder nicht im PATH!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose ist nicht installiert oder nicht im PATH!"
    exit 1
fi

echo ""
echo "Baue und starte alle Services..."
echo ""

# Services stoppen (falls laufend)
echo "Stoppe laufende Services..."
docker-compose down 2>/dev/null || true

# Services bauen und starten
echo "Baue Images..."
if ! docker-compose build; then
    echo "Fehler beim Bauen der Images!"
    exit 1
fi

echo "Starte Services..."
if ! docker-compose up -d; then
    echo "Fehler beim Starten der Services!"
    exit 1
fi

echo ""
echo "Warte auf Services..."
sleep 10

# Status prüfen
echo ""
echo "Service Status:"
docker-compose ps

# Prüfen ob alle Container laufen
echo ""
echo "Prüfe Container-Status..."
failed_containers=()

# Parse docker-compose ps Output
while IFS= read -r line; do
    # Überspringe Header-Zeilen und leere Zeilen
    if [[ "$line" =~ ^NAME ]] || [[ "$line" =~ ^-+$ ]] || [ -z "$line" ]; then
        continue
    fi
    
    # Extrahiere Container-Name (erste Spalte)
    container_name=$(echo "$line" | awk '{print $1}')
    
    # Prüfe ob die Zeile NICHT "Up" enthält (Container läuft nicht)
    if ! echo "$line" | grep -qE "Up"; then
        failed_containers+=("$container_name")
        # Extrahiere Status für Anzeige
        status=$(echo "$line" | grep -oE "(Restarting|Exited|Dead|Created|Paused|starting)" | head -1 || echo "unknown")
        echo "WARNUNG: Container $container_name ist nicht im Status 'running' (Status: $status)"
    fi
done < <(docker-compose ps)

if [ ${#failed_containers[@]} -gt 0 ]; then
    echo ""
    echo "Einige Container sind nicht gestartet!"
    echo "Fehlerhafte Container: $(IFS=','; echo "${failed_containers[*]}")"
    echo ""
    echo "Zeige Logs der fehlerhaften Container..."
    for container in "${failed_containers[@]}"; do
        echo ""
        echo "--- Logs für $container ---"
        docker-compose logs --tail=50 "$container"
    done
    echo ""
    echo "Bitte prüfen Sie die Logs oben und beheben Sie die Fehler."
    exit 1
fi

echo ""
echo "Deployment abgeschlossen!"
echo ""
echo "Services:"
echo "   - API: http://localhost:3000/api"
echo "   - Dashboard: http://localhost"
echo "   - MongoDB: localhost:27017"
echo ""
echo "Logs anzeigen: docker-compose logs -f"
echo "Services stoppen: docker-compose down"
echo ""
