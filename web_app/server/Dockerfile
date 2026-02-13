# This Dockerfile is for the production environment of the 
# server-side of the US News web application. This Dockerfile 
# is used to build the image that will be pushed to ECR and run on App Runner.
# Note that this Dockerfile is to be built in the web_app/ directory.
#
# How to build locally for testing:
#   docker build -f server/Dockerfile -t usnews-server:prod . 
#
# How to run locally for testing (make sure paths are absolute):
#  docker run -p 3000:3000 \
#   -e PORT=3000 \
#   -e INFERENCE_API_URL="http://host.docker.internal:5020" \
#   -e INFERENCE_API_KEY="/app/service/secrets/INFERENCE_API_KEY.txt" \
#   -e RAW_API_KEY="actual-api-key" \
#   --name usnews-server-prod \
#   usnews-server:prod
#
# Author: Osvaldo Hernandez-Segura
# Date Created: February 12, 2026 
# Date Modified: February 12, 2026 
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

