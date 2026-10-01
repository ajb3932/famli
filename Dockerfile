# syntax=docker/dockerfile:1

# ---- Frontend build -----------------------------------------------------------
FROM node:24-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Backend production dependencies -------------------------------------------
FROM node:24-alpine AS backend-deps
WORKDIR /app
# Only used if better-sqlite3 has no prebuilt binary for this platform/arch.
RUN apk add --no-cache python3 make g++
COPY backend/package*.json ./
RUN npm ci --omit=dev

# ---- Runtime -------------------------------------------------------------------
FROM node:24-alpine

ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/app/data/famli.db

WORKDIR /app

# Application files stay owned by root (read-only to the app); only the data
# directory is writable by the unprivileged "node" user (UID 1000).
COPY --from=backend-deps /app/node_modules ./node_modules
COPY backend/package.json ./
COPY backend/src ./src
COPY --from=frontend /app/frontend/dist ./frontend/dist
RUN mkdir -p /app/data && chown node:node /app/data

USER node
EXPOSE 3000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
