#!/bin/bash
set -e

REGISTRY="localhost:5000"
IMAGE_NAME="wordle-web"
CONTAINER_NAME="wordle-web"
VERSION_FILE="VERSION"

# Read current version
if [ ! -f "$VERSION_FILE" ]; then
  echo "VERSION file not found!"
  exit 1
fi

CUR_VERSION=$(cat "$VERSION_FILE" | grep 'version' | grep -Po '\d+\.\d+\.\d+')
IFS='.' read -r major minor patch <<< "$CUR_VERSION"

if [ "$patch" -eq 0 ]; then
  echo "No previous patch version to roll back to."
  exit 1
fi

PREV_VERSION="$major.$minor.$((patch - 1))"
PREV_IMAGE="${REGISTRY}/${IMAGE_NAME}:${PREV_VERSION}"

echo "Rolling back to version ${PREV_VERSION}..."

# Stop and remove current container
docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true

# Run previous version
docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  -p 41124:41124 \
  "${PREV_IMAGE}"

echo "Rolled back to version ${PREV_VERSION}."