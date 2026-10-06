#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE_ROOT="$(dirname "$ROOT")"
WWW_ROOT="$(dirname "$SITE_ROOT")"
STAMP="$(date +%Y%m%d-%H%M%S)"
BUILD_DIR="$WWW_ROOT/.wikiherbalist-build-$STAMP"
RELEASES_DIR="$WWW_ROOT/wikiherbalist-releases"
RELEASE_DIR="$RELEASES_DIR/$STAMP"
WP_CONTENT_PATH="${WP_CONTENT_PATH:-}"

cleanup() {
  rm -rf "$BUILD_DIR"
  rm -f "$ROOT/.output.next"
}
trap cleanup EXIT

if [ ! -L "$ROOT/.output" ]; then
  echo "Refusing deploy: $ROOT/.output must be a release symlink." >&2
  exit 1
fi

if ! pm2 describe wikiherbalist >/dev/null 2>&1; then
  echo "Refusing deploy: PM2 process wikiherbalist is missing." >&2
  exit 1
fi
if [ -z "$WP_CONTENT_PATH" ] || [ ! -d "$WP_CONTENT_PATH" ]; then
  echo "Refusing deploy: WP_CONTENT_PATH must point to an existing directory." >&2
  exit 1
fi
PREVIOUS_TARGET="$(readlink -f "$ROOT/.output")"
mkdir -p "$BUILD_DIR" "$RELEASE_DIR"

rsync -a   --exclude='.git'   --exclude='.output'   --exclude='node_modules'   --exclude='*.bak-*'   "$ROOT/" "$BUILD_DIR/"

# Install exactly the dependencies pinned in package-lock.json inside the
# temporary build. Never mutate or reuse the dependency tree of the live release.
(
  cd "$BUILD_DIR"
  npm ci --no-fund --no-audit
  npm run build
)

test -f "$BUILD_DIR/.output/server/index.mjs"
test -d "$BUILD_DIR/.output/public/_nuxt"

if [ -d "$ROOT/.output/public/_nuxt" ]; then
  rsync -a --ignore-existing     "$ROOT/.output/public/_nuxt/"     "$BUILD_DIR/.output/public/_nuxt/"
fi
mv "$BUILD_DIR/.output" "$RELEASE_DIR/.output"
mv "$BUILD_DIR/node_modules" "$RELEASE_DIR/node_modules"
chmod o+x "$RELEASE_DIR/.output"
chmod -R o+rX "$RELEASE_DIR/.output/public"
ln -sfn "$WP_CONTENT_PATH" "$RELEASE_DIR/.output/public/wp-content"

switch_release() {
  local target="$1"
  ln -s "$target" "$ROOT/.output.next"
  mv -Tf "$ROOT/.output.next" "$ROOT/.output"
}

restart_app() {
  pm2 restart wikiherbalist >/dev/null
}

rollback() {
  switch_release "$PREVIOUS_TARGET"
  restart_app
}

switch_release "$RELEASE_DIR/.output"

if ! restart_app; then
  rollback
  echo "Deploy failed; previous release restored." >&2
  exit 1
fi
sleep 2
ok=0
consecutive=0
for _ in $(seq 1 24); do
  status="$(pm2 jlist | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const a=JSON.parse(s);const p=a.find(x=>x.name==='wikiherbalist');process.stdout.write(p?.pm2_env?.status||'missing')}catch{process.stdout.write('error')}})")"
  if [ "$status" = "online" ] &&      curl -fsS -H 'Host: wikiherbalist.com'        http://127.0.0.1:3010/ >/dev/null 2>&1; then
    consecutive=$((consecutive + 1))
    if [ "$consecutive" -ge 3 ]; then
      ok=1
      break
    fi
  else
    consecutive=0
  fi
  sleep 0.5
done

if [ "$ok" -ne 1 ]; then
  rollback
  echo "Health check failed; previous release restored." >&2
  exit 1
fi
pm2 save >/dev/null

# Keep local tooling aligned with the active release only after the new
# application has passed its health check. Rollback paths retain their own
# node_modules tree.
ln -sfn "$RELEASE_DIR/node_modules" "$ROOT/node_modules"

echo "WikiHerbalist deployed successfully."
echo "Previous release: $PREVIOUS_TARGET"
echo "Current release: $RELEASE_DIR/.output"
