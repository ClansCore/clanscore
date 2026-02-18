# Load GPG_PW from .env (relative to script)
$GPG_PW = ""
$envPath = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match "^\s*GPG_PW\s*=\s*(.+?)\s*$") {
            $GPG_PW = $matches[1]
        }
    }
} else {
    Write-Error ".env file not found at $envPath"
    exit 1
}

# Prompt for file path
$gpgFile = Read-Host "Enter the path to the .tar.gz.gpg backup file"
if (!(Test-Path $gpgFile)) {
    Write-Error "File does not exist: $gpgFile"
    exit 1
}

# Decrypt archive
$tarFile = "$gpgFile".Replace(".gpg", "")
echo $GPG_PW | gpg --batch --yes --passphrase-fd 0 -d $gpgFile > $tarFile
Write-Host "Decrypted archive saved as: $tarFile"

# Extract contents
$extractDir = "data\db-restore"
New-Item -ItemType Directory -Force -Path $extractDir | Out-Null
tar -xzf $tarFile -C $extractDir
Write-Host "Archive extracted to: $extractDir"

# Find restored timestamp folder
$restoreSubdir = Get-ChildItem $extractDir | Select-Object -First 1
$restorePath = Join-Path $extractDir $restoreSubdir

# Run mongorestore inside Docker container
docker exec mongodb mongorestore --drop "/data/db-backup/$restoreSubdir"
Write-Host "Data restored in MongoDB from $restoreSubdir"
