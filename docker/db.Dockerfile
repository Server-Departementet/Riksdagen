# ============================================================================
# Base stage - Common dependencies and setup
# ============================================================================
FROM mariadb:lts AS base

ENV MARIADB_ROOT_PASSWORD=${MARIADB_ROOT_PASSWORD}
ENV MARIADB_DATABASE=${MARIADB_DATABASE}