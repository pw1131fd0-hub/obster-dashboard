# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend files
COPY frontend/package.json frontend/vite.config.ts frontend/tsconfig.json frontend/tsconfig.node.json frontend/postcss.config.js frontend/tailwind.config.js ./

# Install dependencies
RUN npm install

# Copy source files
COPY frontend/src ./src
COPY frontend/public ./public

# Build the frontend
RUN npm run build

# Stage 2: Production nginx
FROM nginx:alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]