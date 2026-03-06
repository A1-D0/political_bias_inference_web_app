#!/usr/bin/env sh

# This script is the entrypoint for the ML service or server container. 
# It sets up the necessary environment and starts the container.
#
# Author: Osvaldo Hernandez-Segura
# Date Created: March 5, 2026 
# Date Modified: March 5, 2026 
# References: Copilot, ChatGPT

# Exit immediately if a command exits with a non-zero status, 
# and treat unset variables as an error
set -eu

if [ -z "${SECRETS_DIR:-}" ]; then
    echo "SECRETS_DIR environment variable is not set. Defaulting to /app/secrets."
    SECRETS_DIR="/app/secrets"
fi

mkdir -p ${SECRETS_DIR:-} 

if [ -n "${RAW_API_KEY:-}" ]; then
    printf "%s" "$RAW_API_KEY" > ${SECRETS_DIR:-}/INTERNAL_API_KEY.txt
    echo "RAW_API_KEY found and written to ${SECRETS_DIR:-}/INTERNAL_API_KEY.txt"
else
    echo "RAW_API_KEY not found in environment variables. Server may not function properly."
fi

# Make the secrets file read-only
chmod 400 ${SECRETS_DIR:-}/INTERNAL_API_KEY.txt

# Run the container CMD,
# which should be the command to start the ML service or server in Dockerfile
exec "$@"

