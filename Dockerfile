# syntax=docker/dockerfile:1

FROM node:22.13.1-alpine

RUN apk add --no-cache bash curl
RUN apk update

# Download AWS DocumentDB CA certificate for TLS connections
RUN curl -o /tmp/global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Declare ARGs to receive the variables from build command.
# Auto assigns from environment variables configured at CI/CD
ARG VITE_AGENT_API_URL
ARG VITE_IS_TEAMS_TAB
ARG VITE_MOCK_AZURE_AD_TOKEN

WORKDIR /app
COPY . .

# Move DocumentDB CA certificate to /app
RUN mv /tmp/global-bundle.pem /app/global-bundle.pem
RUN npm install pnpm -g
RUN pnpm install
RUN pnpm run build:frontend
RUN pnpm run build
RUN chmod +x appStartUp.sh
CMD ./appStartUp.sh