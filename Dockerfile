# syntax=docker/dockerfile:1

FROM node:22.13.1-alpine

RUN apk add --no-cache bash
RUN apk update

# Declare ARGs to receive the variables from build command.
# Auto assigns from environment variables configured at CI/CD
ARG VITE_API_BASE_URL
ARG VITE_IS_NOT_TEAMS_TAB
ARG VITE_MOCK_VALIDATE_TOKEN

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_IS_NOT_TEAMS_TAB=$VITE_IS_NOT_TEAMS_TAB
ENV VITE_MOCK_VALIDATE_TOKEN=$VITE_MOCK_VALIDATE_TOKEN

WORKDIR /app
COPY . .
RUN npm install pnpm -g
RUN pnpm install
RUN pnpm run build:frontend
RUN pnpm run build
RUN chmod +x appStartUp.sh
CMD ./appStartUp.sh