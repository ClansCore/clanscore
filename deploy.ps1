# ClansCore Deployment Script für Windows PowerShell
# Dieses Skript erleichtert das Deployment aller Services

Write-Host "Clanscore Deployment Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Prüfen ob .env existiert
if (-not (Test-Path .env)) {
    Write-Host ".env Datei nicht gefunden!" -ForegroundColor Yellow
    Write-Host "Erstelle .env aus .env.example..." -ForegroundColor Yellow
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Host ".env erstellt. Bitte konfigurieren Sie die Variablen!" -ForegroundColor Green
        Write-Host "Öffnen Sie .env und passen Sie die Werte an." -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host ".env.example nicht gefunden!" -ForegroundColor Red
        exit 1
    }
}

# Docker prüfen
$null = docker --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker ist nicht installiert oder nicht im PATH!" -ForegroundColor Red
    exit 1
}

$null = docker-compose --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker Compose ist nicht installiert oder nicht im PATH!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Baue und starte alle Services..." -ForegroundColor Cyan
Write-Host ""

# Services stoppen (falls laufend)
Write-Host "Stoppe laufende Services..." -ForegroundColor Yellow
$null = docker-compose down 2>&1

# Services bauen und starten
Write-Host "Baue Images..." -ForegroundColor Cyan
$buildResult = docker-compose build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Fehler beim Bauen der Images!" -ForegroundColor Red
    Write-Host $buildResult
    exit 1
}

Write-Host "Starte Services..." -ForegroundColor Cyan
$upResult = docker-compose up -d 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Fehler beim Starten der Services!" -ForegroundColor Red
    Write-Host $upResult
    exit 1
}

Write-Host ""
Write-Host "Warte auf Services..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Status prüfen
Write-Host ""
Write-Host "Service Status:" -ForegroundColor Cyan
docker-compose ps

# Prüfen ob alle Container laufen
Write-Host ""
Write-Host "Prüfe Container-Status..." -ForegroundColor Cyan
$psOutput = docker-compose ps --format json 2>&1
$failedContainers = @()

if ($LASTEXITCODE -eq 0 -and $psOutput -match '\[') {
    try {
        $containers = $psOutput | ConvertFrom-Json
        foreach ($container in $containers) {
            if ($container.State -ne "running") {
                $containerName = if ($container.Name) { $container.Name } else { $container.Service }
                $failedContainers += $containerName
                Write-Host "WARNUNG: Container $containerName ist nicht im Status 'running' (Status: $($container.State))" -ForegroundColor Yellow
            }
        }
    } catch {
        # Fallback: Parse docker-compose ps output manuell
        $psText = docker-compose ps
        $lines = $psText -split "`n" | Select-Object -Skip 2
        foreach ($line in $lines) {
            if ($line -match '^\s*(\S+)\s+(\S+)\s+') {
                $containerName = $matches[1]
                $state = $matches[2]
                if ($state -ne "Up" -and $state -ne "running") {
                    $failedContainers += $containerName
                    Write-Host "WARNUNG: Container $containerName ist nicht im Status 'running' (Status: $state)" -ForegroundColor Yellow
                }
            }
        }
    }
} else {
    # Fallback: Parse docker-compose ps output manuell
    $psText = docker-compose ps
    $lines = $psText -split "`n" | Select-Object -Skip 2
    foreach ($line in $lines) {
        if ($line -match '^\s*(\S+)\s+(\S+)\s+') {
            $containerName = $matches[1]
            $state = $matches[2]
            if ($state -ne "Up" -and $state -ne "running") {
                $failedContainers += $containerName
                Write-Host "WARNUNG: Container $containerName ist nicht im Status 'running' (Status: $state)" -ForegroundColor Yellow
            }
        }
    }
}

if ($failedContainers.Count -gt 0) {
    Write-Host ""
    Write-Host "Einige Container sind nicht gestartet!" -ForegroundColor Red
    Write-Host "Fehlerhafte Container: $($failedContainers -join ', ')" -ForegroundColor Red
    Write-Host ""
    Write-Host "Zeige Logs der fehlerhaften Container..." -ForegroundColor Yellow
    foreach ($container in $failedContainers) {
        Write-Host ""
        Write-Host "--- Logs für $container ---" -ForegroundColor Cyan
        docker-compose logs --tail=50 $container
    }
    Write-Host ""
    Write-Host "Bitte prüfen Sie die Logs oben und beheben Sie die Fehler." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Deployment abgeschlossen!" -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
Write-Host "   - API: http://localhost:3000/api"
Write-Host "   - Dashboard: http://localhost"
Write-Host "   - MongoDB: localhost:27017"
Write-Host ""
Write-Host "Logs anzeigen: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "Services stoppen: docker-compose down" -ForegroundColor Yellow
Write-Host ""
