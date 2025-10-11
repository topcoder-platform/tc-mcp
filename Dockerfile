# syntax=docker/dockerfile:1

FROM node:22.13.1-alpine

RUN apk add --no-cache bash
RUN apk update

# Declare ARGs to receive the variables from build command.
ARG VITE_API_BASE_URL

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /app
COPY . .
RUN npm install pnpm -g
RUN pnpm install
RUN pnpm run build:frontend
RUN pnpm run build
RUN chmod +x appStartUp.sh
CMD ./appStartUp.sh