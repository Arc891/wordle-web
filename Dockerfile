# Dockerfile for Wordle Web Application
# Use multi-stage builds to optimize the image size and separate build dependencies from runtime dependencies

############
# Build stage
############
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .
RUN npm run build

############
# Runtime stage
############
FROM node:20-alpine
WORKDIR /app

# Copy installed dependencies and source
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/vite.config.js ./vite.config.js

# Expose application
EXPOSE 41124

# Start the web-ssh service
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
