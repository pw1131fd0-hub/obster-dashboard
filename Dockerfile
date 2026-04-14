# =============================================================================
# Stage 1: Frontend Builder
# =============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better layer caching
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies with npm ci for reproducible builds
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build the React frontend with Vite
RUN npm run build

# =============================================================================
# Stage 2: nginx Production Server
# =============================================================================
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from frontend builder stage
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check for nginx
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
