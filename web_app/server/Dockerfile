# This Dockerfile is for the production environment of the 
# server-side of the US News web application. This Dockerfile 
# is used to build the image that will be pushed to ECR and run on App Runner.
# Note that this Dockerfile is to be built in the web_app/ directory.
#
# How to build locally for testing, run from the web_app/ directory:
#   docker build -f server/Dockerfile -t usnews-server:prod . 
#
# How to run locally for testing (make sure paths are container absolute):
#  docker run -p 3000:3000 \
#   -e PORT=3000 \
#   -e INFERENCE_API_URL="http://host.docker.internal:5020" \
#   -e INFERENCE_API_KEY="/app/server/secrets/INFERENCE_API_KEY.txt" \
#   -e RAW_API_KEY="actual-api-key" \
#   --name usnews-server-prod \
#   usnews-server:prod
#
# How to build the Docker image for production and push to ECR, 
# run from the web_app/ directory, assuming you have AWS IAM user:
# 1. Build the Docker image for AMD64 (this process may take a while): 
#       docker buildx build --platform linux/amd64 -f server/Dockerfile -t usnews-server:prod . 
# 2. Get caller identity (who are in AWS):
#       aws sts get-caller-identity
# 3. Create ECR repo (ignore if repo already exists):
#       aws ecr create-repository \
#       --region us-east-1 \
#       --repository-name usnews-server 
# 4. Set account id to local shell session:
#       ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
# 5. Authenticate Docker to ECR: 
#       aws ecr get-login-password --region us-east-1 \
#       | docker login --username AWS --password-stdin \
#       ${ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com
# 6. Tag the Docker image for ECR:
#       docker tag usnews-server:prod ${ACCOUNT_ID}.dkr.ecr.<aws_region>.amazonaws.com/usnews-server:prod
# 3. Push the Docker image to ECR:
#       docker push ${ACCOUNT_ID}.dkr.ecr.<aws_region>.amazonaws.com/usnews-server:prod
#
# Note that if you are attempting these commands and they don't work: 
# - Check whether you are in a ROLE session or IAM USER session in the terminal.
# - Run 'unset <CRED-NAME>' for each AWS credential to clear the environment variables 
#   if you need to switch between different IAM users or roles for testing.
#   One-liner version: 
#       unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_PROFILE AWS_REGION AWS_DEFAULT_REGION
#
# Author: Osvaldo Hernandez-Segura
# Date Created: February 12, 2026 
# Date Modified: February 23, 2026 
# References: Copilot, ChatGPT, Docker Documentation

FROM node:20-alpine

# copy shared directory and server source code
WORKDIR /app
COPY shared ./shared
COPY server/src ./server/src
COPY server/tsconfig.json /app/server/tsconfig.json

# install production dependencies
WORKDIR /app/server
COPY server/package.json server/package-lock.json .
RUN npm ci 

# Build TypeScript server
WORKDIR /app/server
RUN npm run build
RUN npm prune --omit=dev

# Add entrypoint script for secrets
COPY server/entrypoint.server.sh /app/server/entrypoint.server.sh
RUN chmod +x entrypoint.server.sh

# Expose the port the server will run on and set 
# the entrypoint and command for the container
EXPOSE 3000
ENTRYPOINT ["/app/server/entrypoint.server.sh"]

CMD ["npm", "start"]

