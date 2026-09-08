#!/bin/sh
set -eu
umask 077

: "${UXARBEITI_ENV_PATH:?Set the absolute path to the private production environment file}"
case "$UXARBEITI_ENV_PATH" in
  /*) ;;
  *) echo 'UXARBEITI_ENV_PATH must be an absolute path.' >&2; exit 1 ;;
esac
test -r "$UXARBEITI_ENV_PATH"
: "${PORT:?Start this command as an alwaysdata Node.js website, not an SSH background process}"
if [ -z "${IP:-}${HOST:-}" ]; then
  echo 'The website must supply its listening IP or HOST.' >&2
  exit 1
fi

export NODEJS_VERSION=24
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
# Optional release preflight runs on the web server, never on the SSH/NFS host.
if [ -f scripts/backup-before-start ]; then
  /usr/bin/node scripts/backup.js
fi
exec /usr/bin/node backend/src/server.js
