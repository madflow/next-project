FROM postgres:18-alpine

RUN apk add --no-cache bash tzdata

COPY docker/backup/database-backup.sh /usr/local/bin/database-backup.sh
COPY docker/backup/backup-entrypoint.sh /usr/local/bin/backup-entrypoint.sh
COPY docker/backup/run-backup.sh /usr/local/bin/run-backup.sh

RUN chmod +x \
  /usr/local/bin/database-backup.sh \
  /usr/local/bin/backup-entrypoint.sh \
  /usr/local/bin/run-backup.sh

ENTRYPOINT ["/usr/local/bin/backup-entrypoint.sh"]
