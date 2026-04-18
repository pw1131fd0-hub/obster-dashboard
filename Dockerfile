# Stage 1: Build frontend with Vite
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better layer caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --quiet

# Copy source code
COPY frontend/ ./

# Build production assets
RUN npm run build

# Stage 2: Production image with nginx
FROM nginx:alpine

# Install additional tools for health checks
RUN apk add --no-cache curl

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create PID file directory
RUN mkdir -p /var/run && touch /var/run/nginx.pid

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]