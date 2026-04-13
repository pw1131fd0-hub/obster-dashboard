# Stage 1: Build React frontend using node:20-alpine
# This stage installs dependencies and runs the production build
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better layer caching
COPY frontend/package*.json ./

# Install npm dependencies
RUN npm install

# Copy full frontend source
COPY frontend/ .

# Build production assets
RUN npm run build

# Stage 2: Serve with nginx:alpine
# Copy built frontend files to nginx html directory
FROM nginx:alpine

# Copy built static files from builder stage
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]