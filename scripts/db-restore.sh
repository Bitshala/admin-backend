#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="$(docker compose ps -q bitshala-db 2>/dev/null || true)"
if [ -z "$CONTAINER_NAME" ]; then
  echo "Error: bitshala-db container is not running. Start it with 'docker compose up -d bitshala-db'"
  exit 1
fi
# Hardcoded to match docker-compose.yml — intentionally not using env vars
# to prevent accidentally restoring into an upstream database.
DB_USER="root"
DB_NAME="bitshala"
SNAPSHOT_DIR="${SNAPSHOT_DIR:-./snapshots}"

# Cross-platform: list .sql files as "<mtime_epoch> <size_bytes> <path>"
find_snapshots() {
  if stat --version > /dev/null 2>&1; then
    # GNU/Linux stat
    find "$SNAPSHOT_DIR" -maxdepth 1 -name '*.sql' -exec stat -c '%Y %s %n' {} \;
  else
    # BSD/macOS stat
    find "$SNAPSHOT_DIR" -maxdepth 1 -name '*.sql' -exec stat -f '%m %z %N' {} \;
  fi
}

SKIP_CONFIRM=false
DRY_RUN=false
LIST=false
SNAPSHOT_ARG=""

usage() {
  cat <<EOF
Usage: bash scripts/db-restore.sh [options] [snapshot.sql]

Options:
  --yes        Skip confirmation prompt
  --dry-run    Validate everything without actually restoring
  --list       List available snapshots and exit
  -h, --help   Show this help message

If no snapshot file is given, the latest .sql file in \$SNAPSHOT_DIR (default: ./snapshots) is used.
EOF
  exit 0
}

while [ $# -gt 0 ]; do
  case "$1" in
    --yes)      SKIP_CONFIRM=true; shift ;;
    --dry-run)  DRY_RUN=true; shift ;;
    --list)     LIST=true; shift ;;
    -h|--help)  usage ;;
    -*)         echo "Unknown option: $1"; usage ;;
    *)          SNAPSHOT_ARG="$1"; shift ;;
  esac
done

# --list: show available snapshots and exit
if [ "$LIST" = true ]; then
  echo "Available snapshots in '${SNAPSHOT_DIR}':"
  echo ""
  if ! find_snapshots 2>/dev/null | sort -rn | while read -r _epoch size file; do
    if command -v numfmt > /dev/null 2>&1; then
      human_size=$(numfmt --to=iec --suffix=B "$size")
    else
      human_size=$(awk "BEGIN { split(\"B KB MB GB\",u); s=$size; i=1; while(s>=1024 && i<4){s/=1024;i++} printf \"%.1f%s\",s,u[i] }")
    fi
    printf "  %-8s  %s\n" "$human_size" "$file"
  done | grep -q .; then
    echo "  (none)"
  fi
  exit 0
fi

# Resolve snapshot file
if [ -n "$SNAPSHOT_ARG" ]; then
  SNAPSHOT_FILE="$SNAPSHOT_ARG"
else
  SNAPSHOT_FILE="$(find_snapshots 2>/dev/null | sort -rn | head -n1 | awk '{print $3}' || true)"
  if [ -z "$SNAPSHOT_FILE" ]; then
    echo "Error: no snapshots found in '${SNAPSHOT_DIR}'"
    exit 1
  fi
  echo "No snapshot specified, using latest: ${SNAPSHOT_FILE}"
fi

if [ ! -f "$SNAPSHOT_FILE" ]; then
  echo "Error: file '${SNAPSHOT_FILE}' not found"
  exit 1
fi

# Verify database is reachable
if ! docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" > /dev/null 2>&1; then
  echo "Error: Postgres in '${CONTAINER_NAME}' is not accepting connections"
  exit 1
fi

echo "Snapshot:  ${SNAPSHOT_FILE}"
echo "Database:  ${DB_NAME}"
echo "Container: ${CONTAINER_NAME}"

if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "Dry run passed. Everything looks good."
  exit 0
fi

# Confirmation prompt
if [ "$SKIP_CONFIRM" = false ]; then
  echo ""
  read -rp "This will drop all existing tables in '${DB_NAME}' and restore from the snapshot. Continue? [y/N] " answer
  if [[ ! "$answer" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# Drop existing tables
echo "Dropping existing tables..."
drop_sql=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c "
  SELECT string_agg('DROP TABLE IF EXISTS \"' || tablename || '\" CASCADE;', ' ')
  FROM pg_tables
  WHERE schemaname = 'public';
")
if [ -n "$drop_sql" ]; then
  docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "$drop_sql" > /dev/null 2>&1
fi

# Also drop custom types/enums so the snapshot can recreate them
drop_types=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c "
  SELECT string_agg('DROP TYPE IF EXISTS \"' || typname || '\" CASCADE;', ' ')
  FROM pg_type
  WHERE typnamespace = 'public'::regnamespace AND typtype = 'e';
")
if [ -n "$drop_types" ]; then
  docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "$drop_types" > /dev/null 2>&1
fi

# Restore
echo "Restoring schema from '${SNAPSHOT_FILE}'..."
LOG_FILE="$(mktemp)"
if docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$SNAPSHOT_FILE" > "$LOG_FILE" 2>&1; then
  echo "Restore complete."
else
  echo "Restore finished with errors:"
  echo ""
  grep -i "error\|fatal" "$LOG_FILE" || cat "$LOG_FILE"
  rm -f "$LOG_FILE"
  exit 1
fi
rm -f "$LOG_FILE"
