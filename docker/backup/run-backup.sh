#!/usr/bin/env bash

set -euo pipefail

. /run/backup/env.sh
exec /usr/local/bin/database-backup.sh
