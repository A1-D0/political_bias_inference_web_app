#!/usr/bin/env sh

# This script is the entrypoint for the service container. 
# It sets up the necessary environment and starts the service.
#
# It checks for the presence of the RAW_API_KEY environment variable, 
# which is the API key for the ML inference service, 
# and if it exists, it writes it to a file that the service can read.
#
# It also checks for the presence of environment variables that specify 
# the S3 file names for the inference model and label encoder model, 
# and if they exist, it logs their presence and values, and downloads 
# the models to the appropriate directory for the service to read.
# The environment variables for the S3 model artifacts are:
# - MODEL_BUCKET: The name of the S3 bucket where the model artifacts are stored.
# - MODEL_PREFIX: The prefix (folder path) in the S3 bucket where the model
#               artifacts are stored. 
#
# Author: Osvaldo Hernandez-Segura
# Date Created: February 12, 2026
# Date Modified: February 14, 2026
# References: Copilot, ChatGPT

# Exit immediately if a command exits with a non-zero status, 
# and treat unset variables as an error
set -eu

# ------ SET UP SECRETS FOR THE SERVICE ------
mkdir -p /app/secrets

# If the ML API key is set in env vars, write it to a file for the server to read
if [ -n "${RAW_API_KEY:-}" ]; then
    printf "%s" "$RAW_API_KEY" > /app/secrets/INFERENCE_API_KEY.txt
    chmod 600 /app/secrets/INFERENCE_API_KEY.txt
    echo "RAW_API_KEY found and written to /app/secrets/INFERENCE_API_KEY.txt."
else
    echo "RAW_API_KEY not found in environment variables. Service may not function properly."
fi

# Make the secrets file read-only
chmod 400 /app/secrets/INFERENCE_API_KEY.txt

# ------ SET UP AUTO S3 MODEL ARTIFACTS DOWNLOADS FOR THE SERVICE ------
# Check for the presence of the required environment variables for S3 model download
: "${MODEL_BUCKET:?MODEL_BUCKET is required}"
: "${MODEL_PREFIX:?MODEL_PREFIX is required}"
echo "MODEL_BUCKET and MODEL_PREFIX found. Setting up model downloads to /app/src/ml_inference_app/models/."

# Download models to: /app/src/ml_inference_app/models/
mkdir -p /app/src/ml_inference_app/models

# Run Python script to download the model artifacts from S3
python /app/src/aws_scripts/download_model_artifacts.py --bucket "$MODEL_BUCKET" --prefix "$MODEL_PREFIX" --output_dir /app/src/ml_inference_app/models

# Run the container CMD,
# which should be the command to start the service in Dockerfile
exec "$@"
