#!/usr/bin/env bash
# Daily pg_dump of the service database, 14 days kept. Run from cron with
# WHD_BASE (service root, holding shared/.env) and WHD_BACKUP_DIR set.
set -euo pipefail
umask 077
DEST="${WHD_BACKUP_DIR:?WHD_BACKUP_DIR required}"
mkdir -p "$DEST"
DATABASE_URL="$(grep -m1 '^DATABASE_URL=' "${WHD_BASE:?WHD_BASE required}/shared/.env" | cut -d= -f2-)"
# raw_payloads can be refetched: dumping it would multiply the size for no gain.
pg_dump --format=custom --exclude-table-data=raw_payloads --dbname="$DATABASE_URL" --file="$DEST/wikiherbalist_data-$(date +%Y%m%d).dump.tmp"
mv "$DEST/wikiherbalist_data-$(date +%Y%m%d).dump.tmp" "$DEST/wikiherbalist_data-$(date +%Y%m%d).dump"
find "$DEST" -name 'wikiherbalist_data-*.dump' -mtime +14 -delete
