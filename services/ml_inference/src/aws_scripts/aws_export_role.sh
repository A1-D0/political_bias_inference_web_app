#!/usr/bin/env bash
# This script assumes an AWS IAM role and exports the 
# temporary credentials as environment variables. 
# This script is only to be used for local development and testing purposes,
# specifically, for running the Docker container locally with the appropriate 
# AWS credentials.
#
# How to run:
# 1. chmod +x aws_export_role.sh
# 2. source ./aws_export_role.sh
# 3. aws sts get-caller-identity (to verify that the credentials are set correctly)
# 
# Author: Osvaldo Hernandez-Segura
# Date Created: February 15, 2026
# Date Modified: February 15, 2026
# References: Copilot, ChatGPT

PROFILE=usnews-dev-role

CREDS=$(aws sts assume-role \
  --role-arn $(aws configure get role_arn --profile $PROFILE) \
  --role-session-name docker-session \
  --profile default \
  --output json)

export AWS_ACCESS_KEY_ID=$(echo "$CREDS" | jq -r .Credentials.AccessKeyId)
export AWS_SECRET_ACCESS_KEY=$(echo "$CREDS" | jq -r .Credentials.SecretAccessKey)
export AWS_SESSION_TOKEN=$(echo "$CREDS" | jq -r .Credentials.SessionToken)
export AWS_REGION=us-east-1
export AWS_DEFAULT_REGION=us-east-1

