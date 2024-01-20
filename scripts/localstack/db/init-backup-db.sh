#!/bin/bash
RETRIES=5
until psql -U $POSTGRES_USER -d "default" -c "select 1" >/dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
	echo "Waiting for postgres server to start, $((RETRIES)) remaining attempts..."
	RETRIES=$((RETRIES -= 1))
	sleep 1
done

# Update the schemas for the 'default' database
SCRIPT_RELATIVE_PATH="$(dirname "$0")"
SCRIPT_PATH="$(realpath $SCRIPT_RELATIVE_PATH)"
BACKUPS_PATH="${SCRIPT_PATH}/backups"

if test -f "${BACKUPS_PATH}/cloud-sql-backup.sql"; then
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "default" <$BACKUPS_PATH/cloud-sql-backup.sql
	BACKUP_EXIT_CODE=$?
	echo "BACKUP_EXIT_CODE=${BACKUP_EXIT_CODE}"
	exit $BACKUP_EXIT_CODE
else
	echo "Missing 'cloud-sql-backup.sql' file"
	exit 1
fi
