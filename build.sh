#!/bin/bash
set -eo pipefail
docker buildx build --no-cache=true -t ${APPNAME}:latest .