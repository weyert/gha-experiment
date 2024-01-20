#!/bin/sh

SCRIPT_RELATIVE_PATH="$(dirname "$0")"
SCRIPT_PATH="$(realpath $SCRIPT_RELATIVE_PATH)"
ROOT_DIR=$(dirname $SCRIPT_PATH)

echo "SCRIPT_RELATIVE_PATH=${SCRIPT_RELATIVE_PATH}"
echo "SCRIPT_PATH=${SCRIPT_PATH}"
echo "ROOT_DIR=${ROOT_DIR}"

# Load the backup file
docker compose -f ./scripts/localstack/docker-compose.yml \
  exec postgres sh \
  /tapico/init-backup-db.sh
IMPORT_BACKUP_EXIT_CODE=$?
echo "IMPORT_BACKUP_EXIT_CODE=${IMPORT_BACKUP_EXIT_CODE}"
if [ -z ${IMPORT_BACKUP_EXIT_CODE+x} ] || [ "$IMPORT_BACKUP_EXIT_CODE" -ne 0 ]; then
	printf "Failed to import the database backup\n"
	exit 1
else
	printf "Successfully imported the database backup\n"
fi
