#!/bin/bash

ENV_PATH="$(cd "$(dirname "$0")/.." && pwd)/.env"
if [ ! -f "$ENV_PATH" ]; then
  echo "ERROR: .env file not found at $ENV_PATH"
  exit 1
fi

set -a
source "$ENV_PATH"
set +a

if [ -z "$GPG_PW" ]; then
  echo "ERROR: GPG_PW is not set in .env"
  exit 1
fi

TIMESTAMP=$(date +"%F-%H-%M-%S")
RAW_PATH="./data/db-backup/$TIMESTAMP"
TAR_PATH="./data/db-backup/$TIMESTAMP.tar.gz"
GPG_PATH="$TAR_PATH.gpg"

# ✅ Dump inside container
docker exec mongodb bash -c "mongodump --out /tmp/$TIMESTAMP"
echo "MongoDB dump created inside container: /tmp/$TIMESTAMP"

# ✅ Copy to host
mkdir -p ./data/db-backup
docker cp "mongodb:/tmp/$TIMESTAMP" "$RAW_PATH"
docker exec mongodb rm -rf "/tmp/$TIMESTAMP"
echo "Dump copied to host: $RAW_PATH"

# ✅ Archive
tar -czf "$TAR_PATH" -C "$(dirname "$RAW_PATH")" "$(basename "$RAW_PATH")"
echo "Archive created: $TAR_PATH"

# ✅ Encrypt
echo "$GPG_PW" | gpg --batch --yes --passphrase-fd 0 -c "$TAR_PATH"
echo "Encrypted archive created: $GPG_PATH"

# ✅ Cleanup
rm -rf "$RAW_PATH" "$TAR_PATH"
echo "Unencrypted files removed."
echo "Secure backup completed: $GPG_PATH"
