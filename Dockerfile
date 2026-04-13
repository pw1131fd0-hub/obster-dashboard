# ─── Stage 1: Build React/Vite frontend ──────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install dependencies first (cached unless package files change)
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# Copy source and build
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: nginx production image ─────────────────────────────────────────
FROM nginx:alpine

LABEL org.opencontainers.image.title="Obster Dashboard" \
      org.opencontainers.image.description="OpenClaw system monitoring dashboard (nginx + static SPA)" \
      org.opencontainers.image.version="1.0.0"

# Static assets from the build stage
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Reverse-proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# wget is available in nginx:alpine; curl is not
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost/api/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
