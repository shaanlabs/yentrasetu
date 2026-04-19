# ─── Stage 1: Build Frontend ────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY app/package*.json ./
RUN npm ci --production=false
COPY app/ ./
RUN npm run build

# ─── Stage 2: Install Backend ───────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --production

# ─── Stage 3: Production Runtime ────────────────────────
FROM node:20-alpine

# Security: run as non-root user
RUN addgroup -g 1001 -S yantrasetu && \
    adduser -S yantrasetu -u 1001

WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Set environment
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

USER yantrasetu

CMD ["node", "backend/src/server.js"]
