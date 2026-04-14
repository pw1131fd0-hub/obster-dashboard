# Stage 1: frontend-builder
# Build the React frontend using node:20-alpine

FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend source files
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: nginx (final image)
# Serve the built frontend and proxy API requests to backend

FROM nginx:alpine

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
