# Database Snapshot & Restore

`scripts/db-snapshot.sh` creates a plain-SQL dump of the Postgres database and saves it as a read-only `.sql` file.

`scripts/db-restore.sh` restores a snapshot into the local Docker Postgres container.

## Prerequisites

- `pg_dump` must be installed (ships with PostgreSQL client tools).

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DB_POSTGRES_HOST` | Database host | Yes |
| `DB_POSTGRES_PORT` | Database port | Yes |
| `DB_POSTGRES_DATABASE_NAME` | Database name | Yes |
| `DB_POSTGRES_USERNAME` | Database user | Yes |
| `DB_POSTGRES_PASSWORD` | Database password | Yes |
| `SNAPSHOT_DIR` | Output directory (default: `./snapshots`) | No |

These are the same `DB_POSTGRES_*` variables the application already uses, so if your shell is configured for running the app you're already set.

## Usage

```bash
# Using existing env vars
bash scripts/db-snapshot.sh

# Or inline
DB_POSTGRES_HOST=localhost \
DB_POSTGRES_PORT=5432 \
DB_POSTGRES_DATABASE_NAME=admin \
DB_POSTGRES_USERNAME=admin \
DB_POSTGRES_PASSWORD=secret \
  bash scripts/db-snapshot.sh

# Custom output directory
SNAPSHOT_DIR=./backups bash scripts/db-snapshot.sh
```

The script writes files to `./snapshots/` (or `$SNAPSHOT_DIR`) with the naming pattern `<database>_<YYYYmmdd_HHMMSS>.sql` and sets them to read-only (mode 444).

---

## Restoring a Snapshot

`scripts/db-restore.sh` loads a `.sql` snapshot into the `bitshala-db` Docker container defined in `docker-compose.yml`. The container must already be running.

### Prerequisites

- Docker and `docker compose` must be available.
- The `bitshala-db` container must be running (`docker compose up -d bitshala-db`).

The database user (`root`) and name (`bitshala`) are hardcoded to match `docker-compose.yml`. This is intentional — the restore script should only target the local Docker container, never an upstream database.

| Variable | Description | Default |
|---|---|---|
| `SNAPSHOT_DIR` | Directory to look for snapshots | `./snapshots` |

### Options

| Flag | Description |
|---|---|
| `--yes` | Skip the confirmation prompt |
| `--dry-run` | Validate snapshot, container, and DB connectivity without restoring |
| `--list` | List available snapshots with sizes and exit |
| `-h`, `--help` | Show help |

### Usage

```bash
# Restore a specific snapshot
bash scripts/db-restore.sh snapshots/bitshala_20260329_120000.sql

# Restore the latest snapshot in the snapshots directory
bash scripts/db-restore.sh

# Skip confirmation
bash scripts/db-restore.sh --yes

# Check what would happen without restoring
bash scripts/db-restore.sh --dry-run

# List available snapshots
bash scripts/db-restore.sh --list
```

The script will:
1. If no file is given, pick the most recent `.sql` file from `./snapshots/` (or `$SNAPSHOT_DIR`).
2. Error if the `bitshala-db` container is not running or Postgres isn't accepting connections.
3. Ask for confirmation before proceeding (unless `--yes` is passed).
4. Drop all existing tables and enum types in the database.
5. Restore the schema from the snapshot and report any errors.
