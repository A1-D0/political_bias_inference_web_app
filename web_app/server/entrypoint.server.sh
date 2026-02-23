#!/usr/bin/env sh

# This script is the entrypoint for the server container. 
# It sets up the necessary environment and starts the server.
# It checks for the presence of the ML_API_KEY environment variable, 
# and if it exists, it writes it to a file that the server can read.
# Finally, it starts the server using Node.js.
#
# Author: Osvaldo Hernandez-Segura
# Date Created: February 12, 2026
# Date Modified: February 12, 2026
# References: Copilot, ChatGPT

# Exit immediately if a command exits with a non-zero status, 
# and treat unset variables as an error
set -eu

mkdir -p /app/server/secrets

# If the ML API key is set in env vars, write it to a file for the server to read
if [ -n "${RAW_API_KEY:-}" ]; then
    printf "%s" "$RAW_API_KEY" > /app/server/secrets/INFERENCE_API_KEY.txt
    chmod 600 /app/server/secrets/INFERENCE_API_KEY.txt
    echo "RAW_API_KEY found and written to /app/server/secrets/INFERENCE_API_KEY.txt"
else
    echo "RAW_API_KEY not found in environment variables. Server may not function properly."
fi

# Make the secrets file read-only
chmod 400 /app/server/secrets/INFERENCE_API_KEY.txt

# Run the container CMD,
# which should be the command to start the server in Dockerfile
exec "$@"
