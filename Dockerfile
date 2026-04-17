# Stage 1: node:20-alpine as frontend-builder
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend package files and install dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copy frontend source code
COPY frontend/ ./

# Build the frontend with Vite production build
RUN npm run build

# Copy dist to /app/frontend/dist
RUN mkdir -p /app/frontend/dist && cp -r dist/* /app/frontend/dist/

# Stage 2: nginx:alpine as final image
FROM nginx:alpine

# Copy the built frontend dist to nginx html directory
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]