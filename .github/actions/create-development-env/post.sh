#!/bin/sh

# Load the backup file
echo "PWD=${PWD}"
docker compose -f $PWD/scripts/localstack/docker-compose.yml exec postgres sh /tapico/init-backup-db.sh
