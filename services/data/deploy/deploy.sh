#!/usr/bin/env bash
# Usage (on the server): WHD_BASE=/srv/wikiherbalist-data WHD_SERVICE=wikiherbalist-data deploy.sh release.tar.gz
# Extracts a release, installs, builds, migrates, switches the "current"
# symlink, restarts the API and rolls back if the health check fails.
# Layout under WHD_BASE: releases/<timestamp>, current -> active release, shared/.env.
set -euo pipefail

BASE="${WHD_BASE:?WHD_BASE required}"
SERVICE="${WHD_SERVICE:?WHD_SERVICE required (systemd unit of the API)}"
ARCHIVE="${1:?release archive required}"
STAMP="$(date +%Y%m%d-%H%M%S)"
RELEASE="$BASE/releases/$STAMP"
PREVIOUS="$(readlink -f "$BASE/current" 2>/dev/null || true)"
HEALTH="${WHD_HEALTH:-http://127.0.0.1:4010/v1/health}"

mkdir -p "$RELEASE"
tar -xzf "$ARCHIVE" -C "$RELEASE"
ln -sfn "$BASE/shared/.env" "$RELEASE/.env"
cd "$RELEASE"

npm ci --no-audit --no-fund
npm run build
npm run lint
npm test
set -a; . "$BASE/shared/.env"; set +a
node dist/cli.js migrate
npm prune --omit=dev --no-audit --no-fund

ln -sfn "$RELEASE" "$BASE/current.next"
mv -Tf "$BASE/current.next" "$BASE/current"
sudo systemctl restart "$SERVICE"

for _ in $(seq 1 20); do
  if curl -fsS "$HEALTH" >/dev/null 2>&1; then
    echo "Deployed $RELEASE"
    # Keep the last five releases.
    ls -1dt "$BASE"/releases/*/ | tail -n +6 | xargs -r rm -rf
    exit 0
  fi
  sleep 1
done

echo "Health check failed" >&2
if [ -n "$PREVIOUS" ] && [ -d "$PREVIOUS" ]; then
  ln -sfn "$PREVIOUS" "$BASE/current.next"
  mv -Tf "$BASE/current.next" "$BASE/current"
  sudo systemctl restart "$SERVICE"
  echo "Rolled back to $PREVIOUS" >&2
fi
exit 1
