# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Root package.json für Workspace-Setup
COPY package.json package-lock.json ./

# Shared Package kopieren
COPY shared/package.json shared/tsconfig.json ./shared/
COPY shared/src ./shared/src

# App Package kopieren
COPY apps/clanscore-api/package*.json ./apps/clanscore-api/
COPY apps/clanscore-api/tsconfig.json ./apps/clanscore-api/

# Dependencies installieren (mit Workspace-Support)
RUN npm install

# Shared Package bauen
WORKDIR /app/shared
RUN npm run build

# App Source kopieren und bauen
WORKDIR /app
COPY apps/clanscore-api/src ./apps/clanscore-api/src

WORKDIR /app/apps/clanscore-api
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

# wget für Health Checks installieren
RUN apk add --no-cache wget

WORKDIR /app

# Root package.json für Workspace-Setup
COPY package.json package-lock.json ./

# Shared Package für Production
COPY shared/package.json ./shared/
COPY --from=builder /app/shared/dist ./shared/dist

# App Package für Production
COPY apps/clanscore-api/package*.json ./apps/clanscore-api/

# Nur Production Dependencies installieren
RUN npm install --omit=dev

# Build-Artefakte kopieren
COPY --from=builder /app/apps/clanscore-api/dist ./apps/clanscore-api/dist

WORKDIR /app/apps/clanscore-api

# Port freigeben
EXPOSE 3000

# Server starten
CMD ["node", "dist/index.js"]
