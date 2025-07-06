#!/bin/bash
set -e

REGISTRY="localhost:5000"  # Change to your server's IP if needed
IMAGE_NAME="wordle-web"
VERSION_FILE="package.json"

# Read and bump version
CUR_VERSION=$(cat "$VERSION_FILE" | grep 'version' | grep -Po '\d+\.\d+\.\d+')
IFS='.' read -r major minor patch <<< "$CUR_VERSION"
NEW_VERSION="$major.$minor.$((patch + 1))"
echo "$NEW_VERSION" > "$VERSION_FILE"

# Build and tag image
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${NEW_VERSION}"
LATEST_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:latest"

echo "Building Docker image '${FULL_IMAGE_NAME}'..."
docker build -t "${FULL_IMAGE_NAME}" -t "${LATEST_IMAGE_NAME}" .

echo "Pushing images to registry..."
docker push "${FULL_IMAGE_NAME}"
docker push "${LATEST_IMAGE_NAME}"

# Stop and remove any existing container
CONTAINER_NAME="wordle-web"
echo "Stopping and removing any existing container '${CONTAINER_NAME}'..."
docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true

# Run the new version
echo "Running container '${CONTAINER_NAME}' (version ${NEW_VERSION})..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  -p 41124:41124 \
  "${FULL_IMAGE_NAME}"

echo "Deployed version ${NEW_VERSION}."