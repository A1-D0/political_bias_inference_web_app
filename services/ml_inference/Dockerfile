# This is the Dockerfile to run in production for the ml inference service. 
# This Dockerfile is used to build the image that will be pushed to ECR and run on App Runner.
# 
# How to build locally for testing, run from the ml_inference/ directory:
#   docker build -f Dockerfile -t us_news_web-ml-inference-service:prod .
#
# How to run locally for testing (this is formatted as a multi-line command for readability, 
# but should be run as a single command in the terminal, making sure to write this in one line):
#   docker run -p 5020:5020 \
#   -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY \
#   -e AWS_SESSION_TOKEN -e AWS_REGION \
#
#   -e RAW_API_KEY="actual-api-key" \ 
#   -e MODEL_BUCKET="us-news-bias-models" -e MODEL_PREFIX="models" \
#
#   -e HOST=0.0.0.0 -e PORT=5020 \
#   -e MODELS_DIR="/app/src/ml_inference_app/models" \
#   -e MODEL_FILE="linear_svc_pipeline_v1.joblib" \
#   -e LABEL_ENCODER_FILE="articles-bypublisher_LabelEncoder_v1.joblib" \
#   -e INTERNAL_API_KEY="/app/secrets/INFERENCE_API_KEY.txt" \ 
#   --name us_news_web-ml-inference-service-prod \
#   us_news_web-ml-inference-service:prod
# 
# One-liner version of the above command for testing locally: 
# docker run -p 5020:5020 -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_SESSION_TOKEN -e AWS_REGION -e RAW_API_KEY="actual-api-key" -e MODEL_BUCKET="us-news-bias-models" -e MODEL_PREFIX="models/" -e HOST=0.0.0.0 -e PORT=5020 -e MODELS_DIR="/app/src/ml_inference_app/models" -e MODEL_FILE="linear_svc_pipeline_v1.joblib" -e LABEL_ENCODER_FILE="articles-bypublisher_LabelEncoder_v1.joblib" -e INTERNAL_API_KEY="/app/secrets/INFERENCE_API_KEY.txt" --name us_news_web-ml-inference-service-prod us_news_web-ml-inference-service:prod
# 
# To get the AWS credentials for testing locally, 
# run the following commands, assuming AWS CLI is installed
# and the IAM user and US-News-Web-App can be assumed to exist in the terminal 
# (check AWS IAM 'Roles' and 'Permissions'): 
#   1. chmod +x src/aws_scripts/aws_export_role.sh
#   2. source src/aws_scripts/aws_export_role.sh
#
# Note that if you are attempting these commands and they don't work: 
# - Check whether you are in a ROLE session or IAM USER session in the terminal.
# - Run 'unset <CRED-NAME>' for each AWS credential to clear the environment variables 
#   if you need to switch between different IAM users or roles for testing.
#   One-liner version: 
#       unset aws_access_key_id aws_secret_access_key aws_session_token aws_profile aws_region aws_default_region
#
# How to build the Docker image for production and push to ECR, 
# run from the ml_inference/ directory, assuming you have AWS IAM user:
# 1. Build the Docker image for AMD64 (this process may take a while): 
#       docker buildx build --platform linux/amd64 -f Dockerfile -t us_news_web-ml-inference-service:prod . 
# 2. Get caller identity (who are in AWS):
#       aws sts get-caller-identity
# 3. Create ECR repo (ignore if repo already exists):
#       aws ecr create-repository \
#       --region us-east-1 \
#       --repository-name ml_inference
# 4. Set account id to local shell session:
#       ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
# 5. Authenticate Docker to ECR: 
#       aws ecr get-login-password --region us-east-1 \
#       | docker login --username AWS --password-stdin \
#       ${ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com
# 6. Tag the Docker image for ECR:
#       docker tag us_news_web-ml-inference-service:prod ${ACCOUNT_ID}.dkr.ecr.<aws_region>.amazonaws.com/ml_inference-service:prod
# 3. Push the Docker image to ECR:
#       docker push ${ACCOUNT_ID}.dkr.ecr.<aws_region>.amazonaws.com/ml_inference:prod
#
# Author: Osvaldo Hernandez-Segura
# Date Created: February 14, 2026
# Date Modified: February 19, 2026
# References: Copilot, ChatGPT

# ------------ BUILDER ------------  
FROM python:3.11-slim-bookworm AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential g++ python3-dev \
        && rm -rf /var/lib/apt/lists/*

# Install the custom utils wheel and copy production requirements
COPY wheels/ /build/wheels 
COPY requirements.prod.txt .

RUN pip wheel --no-cache-dir --wheel-dir /build/wheels -r requirements.prod.txt \
        && cp requirements.prod.txt /build/wheels/requirements.prod.txt

# Copy the ml inference service source code and pyproject.toml into the image, 
# and build a wheel for the ml inference service package (i.e., the app)
COPY pyproject.toml ./
COPY src ./src
RUN pip wheel --no-cache-dir --wheel-dir /build/wheels .

# ------------ RUNTIME ------------  
FROM python:3.11-slim-bookworm AS runtime

ENV PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        && rm -rf /var/lib/apt/lists/*

# Copy the built wheels from the builder stage and install them in runtime stage
COPY --from=builder /build/wheels/ /wheels

# Install production dependencies from the copied wheels (no build tools needed in runtime stage)
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r /wheels/requirements.prod.txt \
        && pip install --no-cache-dir /wheels/utils-*.whl \ 
        && pip install --no-cache-dir --no-index --find-links=/wheels "ml-inference" 

# For downloading S3 model artifacts during container startup
COPY src/aws_scripts ./src/aws_scripts
COPY entrypoint.service.sh .
RUN chmod +x entrypoint.service.sh
ENTRYPOINT ["/app/entrypoint.service.sh"]

EXPOSE 5020

WORKDIR /app/src/
CMD ["gunicorn", "ml_inference_app.app:app", "--bind", "0.0.0.0:5020", "--workers", "2"]


# ------------ OLD VERSION OF DOCKERFILE ------------ 
# FROM python:3.11-slim
#
# RUN apt-get update && apt-get install -y --no-install-recommends \
#         build-essential \
#         g++ \
#         python3-dev \
#         && rm -rf /var/lib/apt/lists/*
#
# WORKDIR /app
#
# # Copy the custom utils wheel and install it. 
# # This is necessary because the ml inference service depends on the utils package.
# COPY wheels/ ./tmp/wheels
# RUN pip install --no-cache-dir ./tmp/wheels/utils-*.whl
#
# # Copy the production requirements and install them.
# COPY dev_requirements.txt .
# RUN pip install --no-cache-dir -r dev_requirements.txt
#
# COPY src/aws_scripts ./src/aws_scripts
# COPY src/ml_inference_app ./src/ml_inference_app
# COPY pyproject.toml entrypoint.service.sh . 
#
# # Install the ml inference service package to allow us 
# # to run the service using the command line interface.
# RUN pip install -e .
#
# EXPOSE 5020
#
# # Download model artifacts from S3 
# RUN chmod +x entrypoint.service.sh
# ENTRYPOINT ["/app/entrypoint.service.sh"]
#
# # Run the ml inference service using gunicorn with 2 workers to allow for concurrent requests.
# WORKDIR /app/src/
# CMD ["gunicorn", "ml_inference_app.app:app", "--bind", "0.0.0.0:5020", "--workers", "2"]
