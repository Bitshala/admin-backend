#!/usr/bin/env bash
set -euo pipefail

# Required environment variables (fall back to the same names used by the app)
DB_HOST="${DB_POSTGRES_HOST:?'DB_POSTGRES_HOST is required'}"
DB_PORT="${DB_POSTGRES_PORT:?'DB_POSTGRES_PORT is required'}"
DB_NAME="${DB_POSTGRES_DATABASE_NAME:?'DB_POSTGRES_DATABASE_NAME is required'}"
DB_USER="${DB_POSTGRES_USERNAME:?'DB_POSTGRES_USERNAME is required'}"
DB_PASS="${DB_POSTGRES_PASSWORD:?'DB_POSTGRES_PASSWORD is required'}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTPUT_DIR="${SNAPSHOT_DIR:-./snapshots}"
OUTPUT_FILE="${OUTPUT_DIR}/${DB_NAME}_${TIMESTAMP}.sql"

mkdir -p "$OUTPUT_DIR"

echo "Taking snapshot of database '${DB_NAME}' on ${DB_HOST}:${DB_PORT}..."

PGPASSWORD="$DB_PASS" pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=plain \
  --no-owner \
  --no-privileges \
  > "$OUTPUT_FILE"

chmod 444 "$OUTPUT_FILE"

echo "Snapshot saved to ${OUTPUT_FILE} (read-only)"
