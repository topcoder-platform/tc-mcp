# syntax=docker/dockerfile:1

FROM node:22.13.1-alpine

RUN apk add --no-cache bash
RUN apk update

WORKDIR /app
COPY . .
RUN npm install pnpm -g
RUN pnpm install

# Hardcoded backend api for frontend build
ENV VITE_API_BASE_URL="https://tc-mcp-railway-deployment-production.up.railway.app/v6/mcp/agent"

RUN pnpm run build:frontend
RUN pnpm run build
RUN chmod +x appStartUp.sh
CMD ./appStartUp.sh