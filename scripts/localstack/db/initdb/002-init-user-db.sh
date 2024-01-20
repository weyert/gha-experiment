#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	    -- Create a user named cloudsqlsuperuser
	    DROP USER IF EXISTS cloudsqlsuperuser;
	    CREATE ROLE cloudsqlsuperuser WITH LOGIN CREATEDB CREATEROLE INHERIT PASSWORD 'Welcome1';

	    -- Create user 'default' and associated database with same name
	    DROP USER IF EXISTS "default";
	    CREATE ROLE "default" WITH LOGIN CREATEDB CREATEROLE REPLICATION INHERIT PASSWORD 'Welcome1';
	    CREATE DATABASE "default" OWNER "default";

	    -- Create a replication_user
	    DROP USER IF EXISTS replication_user;
	    CREATE USER replication_user WITH LOGIN CREATEDB CREATEROLE INHERIT REPLICATION;
EOSQL
