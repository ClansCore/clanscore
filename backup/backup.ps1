# Read GPG_PW from .env manually (path relative to script)
$GPG_PW = ""
$envPath = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match "^\s*GPG_PW\s*=\s*(.+?)\s*$") {
            $GPG_PW = $matches[1]
        }
    }
} else {
    Write-Warning ".env file not found at $envPath"
}

# Timestamp and paths
$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
$rawPath = "data\db-backup\$timestamp"
$tarPath = "data\db-backup\$timestamp.tar.gz"
$gpgPath = "$tarPath.gpg"

# Run MongoDB dump inside container
docker exec mongodb mongodump --out "/data/db-backup/$timestamp"
Write-Host "MongoDB backup created at: $rawPath"

# Create archive
tar -czf $tarPath -C "data\db-backup" $timestamp
Write-Host "Archive created: $tarPath"

# Encrypt archive if GPG_PW is set
if (-not [string]::IsNullOrWhiteSpace($GPG_PW)) {
    echo $GPG_PW | gpg --batch --yes --passphrase-fd 0 -c $tarPath
    Write-Host "Encrypted archive created: $gpgPath"

    # Clean up original files
    Remove-Item -Recurse -Force $rawPath
    Remove-Item -Force $tarPath
    Write-Host "Unencrypted files removed."
} else {
    Write-Warning "GPG_PW is not set - backup remains unencrypted."
}

Write-Host ""
Write-Host "Secure backup completed."
