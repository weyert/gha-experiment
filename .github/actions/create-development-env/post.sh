#!/bin/sh

# Load the backup file
docker compose -f $PWD/scripts/localstack/docker-compose.yml exec postgres sh /tapico/init-backup-db.sh
