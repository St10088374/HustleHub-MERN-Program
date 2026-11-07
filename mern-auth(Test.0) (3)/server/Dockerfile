# Production Dockerfile for HustleHub+ Backend
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Generate SSL certificates if needed
RUN node generate-certs.js

# Expose backend API port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Run server as non-root user for security hardening
USER node

CMD ["node", "server.js"]
