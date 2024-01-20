#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE EXTENSION IF NOT EXISTS pglogical;

	  SELECT pglogical.create_node(
	      node_name := 'node-postgres',
	      dsn := 'host=localhost port=5432 dbname=postgres user=replication_user password=Welcome1'
	  );

	  SELECT pglogical.create_replication_set('global');
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "default" <<-EOSQL
	CREATE EXTENSION IF NOT EXISTS pglogical;

	  SELECT pglogical.create_node(
	      node_name := 'node-default',
	      dsn := 'host=localhost port=5432 dbname=default user=replication_user password=Welcome1'
	  );

	  SELECT pglogical.create_replication_set('global');
EOSQL
