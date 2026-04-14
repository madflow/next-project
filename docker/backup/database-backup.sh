#!/usr/bin/env bash

set -euo pipefail

required_vars=(
  BACKUP_DB_HOST
  BACKUP_DB_PORT
  BACKUP_DB_NAME
  BACKUP_DB_USER
  BACKUP_DB_PASSWORD
  BACKUP_DIR
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required environment variable: ${var_name}" >&2
    exit 1
  fi
done

BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

mkdir -p "${BACKUP_DIR}"

timestamp="$(date +"%Y%m%d_%H%M%S")"
backup_file="${BACKUP_DIR}/${BACKUP_DB_NAME}_daily_${timestamp}.sql"

export PGPASSWORD="${BACKUP_DB_PASSWORD}"
trap 'unset PGPASSWORD' EXIT

pg_dump \
  --host="${BACKUP_DB_HOST}" \
  --port="${BACKUP_DB_PORT}" \
  --username="${BACKUP_DB_USER}" \
  --dbname="${BACKUP_DB_NAME}" \
  >"${backup_file}"

gzip "${backup_file}"
echo "Backup successful: ${backup_file}.gz"

find "${BACKUP_DIR}" \
  -maxdepth 1 \
  -type f \
  -mtime "+${BACKUP_RETENTION_DAYS}" \
  -name "${BACKUP_DB_NAME}_daily_*.sql.gz" \
  -exec rm -f {} \;
