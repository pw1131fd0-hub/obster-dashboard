# Stage 1: Build frontend with Node.js
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy dependency files first for better layer caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy frontend source
COPY frontend/ ./

# Build production bundle
RUN npm run build

# Stage 2: Final image with nginx
FROM nginx:alpine

# Copy frontend build artifacts
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]