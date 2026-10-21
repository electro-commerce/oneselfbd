#!/usr/bin/env bash
# ==============================================================================
# Database Restore Helper Script for Oneself VPS
# ==============================================================================
# Usage:
#   chmod +x restore-db.sh
#   ./restore-db.sh [path-to-dump-dir-or-tar]
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables if .env exists
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

DB_USER="${MONGO_INITDB_ROOT_USERNAME:-oneself}"
DB_PASS="${MONGO_INITDB_ROOT_PASSWORD:-oneself_secret_pass}"
DB_NAME="${MONGO_INITDB_DATABASE:-oneself}"
CONTAINER_NAME="oneself-mongo-prod"

DUMP_INPUT="${1:-oneself_dump_*.tar.gz}"

# Handle wildcard or specific file
DUMP_FILE=$(ls -t $DUMP_INPUT 2>/dev/null | head -n 1)

if [ -z "$DUMP_FILE" ] && [ ! -d "oneself" ]; then
  echo "❌ Error: Could not find dump file or 'oneself' folder."
  echo "Usage: ./restore-db.sh <path-to-oneself_dump.tar.gz | path-to-dump-dir>"
  exit 1
fi

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

if [ -f "$DUMP_FILE" ]; then
  echo "📦 Extracting $DUMP_FILE..."
  tar -xzf "$DUMP_FILE" -C "$TEMP_DIR"
  DUMP_DIR="$TEMP_DIR/oneself"
elif [ -d "$1" ]; then
  DUMP_DIR="$1"
elif [ -d "oneself" ]; then
  DUMP_DIR="oneself"
fi

if [ ! -d "$DUMP_DIR" ]; then
  echo "❌ Error: Extracted dump folder not found at $DUMP_DIR"
  exit 1
fi

echo "🔍 Checking for running MongoDB container ($CONTAINER_NAME)..."
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "🐳 Detected Docker container '$CONTAINER_NAME'."
  echo "🚀 Copying dump into container..."
  docker exec "$CONTAINER_NAME" rm -rf /tmp/oneself_restore_dump
  docker cp "$DUMP_DIR" "${CONTAINER_NAME}:/tmp/oneself_restore_dump"

  echo "🔄 Restoring database '$DB_NAME'..."
  docker exec "$CONTAINER_NAME" mongorestore \
    --username "$DB_USER" \
    --password "$DB_PASS" \
    --authenticationDatabase "admin" \
    --db "$DB_NAME" \
    --drop \
    /tmp/oneself_restore_dump

  echo "🧹 Cleaning temporary container files..."
  docker exec "$CONTAINER_NAME" rm -rf /tmp/oneself_restore_dump
else
  echo "ℹ️ Docker container '$CONTAINER_NAME' is not running."
  echo "Attempting restore using local mongorestore on host..."
  mongorestore --db "$DB_NAME" --drop "$DUMP_DIR"
fi

echo "✅ Database restore completed successfully!"
