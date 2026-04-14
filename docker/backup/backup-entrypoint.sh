#!/usr/bin/env bash

set -euo pipefail

required_vars=(
  BACKUP_SCHEDULE
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

export BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
export TZ="${TZ:-UTC}"

mkdir -p "${BACKUP_DIR}"
mkdir -p /run/backup

cat > /run/backup/env.sh <<EOF
export BACKUP_DB_HOST=$(printf '%q' "${BACKUP_DB_HOST}")
export BACKUP_DB_PORT=$(printf '%q' "${BACKUP_DB_PORT}")
export BACKUP_DB_NAME=$(printf '%q' "${BACKUP_DB_NAME}")
export BACKUP_DB_USER=$(printf '%q' "${BACKUP_DB_USER}")
export BACKUP_DB_PASSWORD=$(printf '%q' "${BACKUP_DB_PASSWORD}")
export BACKUP_DIR=$(printf '%q' "${BACKUP_DIR}")
export BACKUP_RETENTION_DAYS=$(printf '%q' "${BACKUP_RETENTION_DAYS}")
export TZ=$(printf '%q' "${TZ}")
EOF

cat > /etc/crontabs/root <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
CRON_TZ=${TZ}
${BACKUP_SCHEDULE} /usr/local/bin/run-backup.sh >> /proc/1/fd/1 2>> /proc/1/fd/2
EOF

echo "Configured backup schedule '${BACKUP_SCHEDULE}' for database '${BACKUP_DB_NAME}'"

exec crond -f -l 2
