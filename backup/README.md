# Database backups

Timestamped snapshots of the `vocab_learning` Postgres database.

## Latest layout

Each run creates a folder named `YYYYMMDDTHHMMSSZ/` containing:

| File | Format | Use |
|------|--------|-----|
| `vocab_learning.sql` | Plain SQL | Human-readable; restore with `psql` |
| `vocab_learning.dump` | PostgreSQL custom | Smaller/faster; restore with `pg_restore` |

## Create a new backup

```bash
BACKUP_DIR="backup/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"
docker exec vocab-db pg_dump -U postgres -d vocab_learning --no-owner --no-acl > "$BACKUP_DIR/vocab_learning.sql"
docker exec vocab-db pg_dump -U postgres -d vocab_learning --no-owner --no-acl -F c -f /tmp/vocab_backup.dump
docker cp vocab-db:/tmp/vocab_backup.dump "$BACKUP_DIR/vocab_learning.dump"
docker exec vocab-db rm /tmp/vocab_backup.dump
```

## Restore (keeps volume; overwrites current data)

**From SQL:**

```bash
docker exec -i vocab-db psql -U postgres -d vocab_learning < backup/YYYYMMDDTHHMMSSZ/vocab_learning.sql
```

**From custom dump:**

```bash
docker cp backup/YYYYMMDDTHHMMSSZ/vocab_learning.dump vocab-db:/tmp/restore.dump
docker exec vocab-db pg_restore -U postgres -d vocab_learning --clean --if-exists /tmp/restore.dump
docker exec vocab-db rm /tmp/restore.dump
```

Backups may contain personal vocabulary data — do not commit them to git.
