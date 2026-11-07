# Stage 1: Build the React Application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Support configurable API URL at build time (defaults to local Express port 5000)
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

# Build Vite application to /app/dist
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

# Copy custom Nginx configuration for React Single Page Application (SPA)
RUN echo 'server {' \
  '  listen 80;' \
  '  server_name localhost;' \
  '  location / {' \
  '    root /usr/share/nginx/html;' \
  '    index index.html index.htm;' \
  '    try_files $uri $uri/ /index.html;' \
  '  }' \
  '  add_header X-Frame-Options "DENY";' \
  '  add_header X-Content-Type-Options "nosniff";' \
  '  add_header Referrer-Policy "strict-origin-when-cross-origin";' \
  '}' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
