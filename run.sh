IMAGE_NAME="wordle-web:latest"
CONTAINER_NAME="wordle-web"

echo "Building Docker image '${IMAGE_NAME}'..."
docker build -t "${IMAGE_NAME}" .

echo "Stopping and removing any existing container '${CONTAINER_NAME}'..."
docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true

echo "Running container '${CONTAINER_NAME}' (with restart=unless-stopped)..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  -p 41124:41124 \
   "${IMAGE_NAME}"