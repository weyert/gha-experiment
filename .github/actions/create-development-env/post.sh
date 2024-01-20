#!/bin/sh

# Load the backup file
docker compose -f ./scripts/localstack/docker-compose.yml exec postgres sh /tapico/init-backup-db.sh
