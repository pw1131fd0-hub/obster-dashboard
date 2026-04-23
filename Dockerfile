# Stage 1 (frontend-builder):
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2 (nginx):
FROM nginx:alpine

# Copy built frontend to /usr/share/nginx/html
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy nginx.conf to /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]