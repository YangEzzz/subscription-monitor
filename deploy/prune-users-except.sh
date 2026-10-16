#!/usr/bin/env bash
# Explicit maintenance only. No API endpoint or automatic startup hook.
set -euo pipefail
umask 077
cd "$(dirname "$0")/.."
if [ "$#" -ne 3 ]; then
  printf '%s\n' 'Usage: bash deploy/prune-users-except.sh KEEP_USER_ONE KEEP_USER_TWO EXPECTED_TOTAL' >&2
  exit 1
fi
keep_one=$1
keep_two=$2
expected_total=$3
if ! [[ "$keep_one" =~ ^wx_[0-9a-f]{64}$ && "$keep_two" =~ ^wx_[0-9a-f]{64}$ && "$keep_one" != "$keep_two" && "$expected_total" =~ ^[0-9]{1,6}$ ]]; then
  printf '%s\n' 'Invalid retained user IDs or expected count; nothing changed.' >&2
  exit 1
fi
test -f deploy/.env.production
test -f deploy/prune-users-except.sql

stamp=$(date +%Y%m%d-%H%M%S)
mkdir -p backups
backup_path="backups/pre-user-prune-$stamp.dump"
sudo docker compose --env-file deploy/.env.production exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup_path"
test -s "$backup_path"
# Verify the backup archive before invoking any DELETE statements.
sudo docker compose --env-file deploy/.env.production exec -T postgres \
  pg_restore --list < "$backup_path" > /dev/null
printf 'Database backup: %s\n' "$backup_path"

sudo docker compose --env-file deploy/.env.production exec -T postgres \
  sh -c 'psql -X -v ON_ERROR_STOP=1 -v keep_user_one="$1" -v keep_user_two="$2" -v expected_total="$3" -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  sh "$keep_one" "$keep_two" "$expected_total" < deploy/prune-users-except.sql
printf '%s\n' 'Cleanup committed. Refresh the admin user list.'
