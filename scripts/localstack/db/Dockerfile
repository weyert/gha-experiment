FROM postgres:14

RUN apt-get update && apt-get install -y --no-install-recommends \
  postgresql-$PG_MAJOR-pgaudit postgresql-$PG_MAJOR-pglogical

RUN mkdir -p /docker-entrypoint-initdb.d/

COPY ./initdb /docker-entrypoint-initdb.d/

RUN ls -la /docker-entrypoint-initdb.d/

RUN mkdir -p /tapico/backups
