#!/usr/bin/env bash
# Run on the existing Docker host after pulling the user-access change.
set -euo pipefail
umask 077
cd "$(dirname "$0")/.."
command -v python3 >/dev/null
test -f deploy/.env.production

api_id=$(sudo docker compose --env-file deploy/.env.production ps -q api)
test -n "$api_id"
# Nginx runs on the host. Trust the exact Docker gateway(s), not all private IPs.
proxy_cidrs=$(sudo docker inspect --format '{{range .NetworkSettings.Networks}}{{println .Gateway}}{{end}}' "$api_id" | awk 'NF' | sort -u | paste -sd, -)
test -n "$proxy_cidrs"

stamp=$(date +%Y%m%d-%H%M%S)
mkdir -p backups
cp -p deploy/.env.production "backups/pre-user-access-$stamp.env"
sudo docker compose --env-file deploy/.env.production exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "backups/pre-user-access-$stamp.dump"

python3 - "$proxy_cidrs" <<'PY'
import ipaddress
import pathlib
import sys

for address in sys.argv[1].split(','):
    ipaddress.ip_address(address)
path = pathlib.Path('deploy/.env.production')
lines = path.read_text().splitlines()
lines = [line for line in lines if not line.startswith('TRUSTED_PROXY_CIDRS=')]
lines.append('TRUSTED_PROXY_CIDRS=' + sys.argv[1])
path.write_text('\n'.join(lines) + '\n')
PY

sudo docker compose --env-file deploy/.env.production config --quiet
sudo docker compose --env-file deploy/.env.production build api
sudo docker compose --env-file deploy/.env.production run --rm migrate
sudo docker compose --env-file deploy/.env.production up -d --no-deps --force-recreate api
sudo docker compose --env-file deploy/.env.production ps api
printf '%s\n' 'API updated. New visits will record IP after health checks pass.'
