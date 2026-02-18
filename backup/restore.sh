#!/bin/bash

# Load .env
ENV_PATH="$(cd "$(dirname "$0")/.." && pwd)/.env"
if [ ! -f "$ENV_PATH" ]; then
  echo "ERROR: .env file not found"
  exit 1
fi

set -a
source "$ENV_PATH"
set +a

if [ -z "$GPG_PW" ]; then
  echo "ERROR: GPG_PW is not set"
  exit 1
fi

# Prompt for file
read -p "Enter path to .tar.gz.gpg backup file: " GPG_FILE
if [ ! -f "$GPG_FILE" ]; then
  echo "ERROR: File not found: $GPG_FILE"
  exit 1
fi

# Decrypt
TAR_FILE="${GPG_FILE%.gpg}"
echo "$GPG_PW" | gpg --batch --yes --passphrase-fd 0 -d "$GPG_FILE" > "$TAR_FILE"
echo "Decrypted archive: $TAR_FILE"

# Extract
RESTORE_DIR="./data/db-restore"
mkdir -p "$RESTORE_DIR"
tar -xzf "$TAR_FILE" -C "$RESTORE_DIR"
echo "Archive extracted to: $RESTORE_DIR"

# Detect restore path
if [ -d "$RESTORE_DIR/discordbot" ]; then
  RESTORE_PATH="$RESTORE_DIR/discordbot"
elif find "$RESTORE_DIR" -mindepth 2 -type f -name '*.bson' | grep -q .; then
  RESTORE_PATH=$(find "$RESTORE_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)
elif find "$RESTORE_DIR" -mindepth 1 -type f -name '*.bson' | grep -q .; then
  RESTORE_PATH="$RESTORE_DIR"
else
  echo "ERROR: No BSON files found in extracted backup."
  exit 1
fi

# Copy to container
docker cp "$RESTORE_PATH" mongodb:/tmp/restore

# 🔧 Safe find: fully inside bash -c with nested quoting
CONTAINER_RESTORE_PATH=$(docker exec mongodb bash -c 'find /tmp/restore -type d -name "discordbot" | head -n 1')
if [ -z "$CONTAINER_RESTORE_PATH" ]; then
  CONTAINER_RESTORE_PATH="/tmp/restore"
fi

# Restore
PARENT_DIR=$(dirname "$CONTAINER_RESTORE_PATH")
docker exec mongodb bash -c "mongorestore --drop --dir=\"$PARENT_DIR\""
docker exec mongodb rm -rf /tmp/restore

echo "MongoDB restored from: $CONTAINER_RESTORE_PATH"
