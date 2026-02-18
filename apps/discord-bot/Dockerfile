# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Root package.json für Workspace-Setup
COPY package.json package-lock.json ./

# Shared Package kopieren
COPY shared/package.json shared/tsconfig.json ./shared/
COPY shared/src ./shared/src

# App Package kopieren
COPY apps/discord-bot/package*.json ./apps/discord-bot/
COPY apps/discord-bot/tsconfig.json ./apps/discord-bot/

# Dependencies installieren (mit Workspace-Support)
RUN npm install

# Shared Package bauen
WORKDIR /app/shared
RUN npm run build

# App Source kopieren und bauen
WORKDIR /app
COPY apps/discord-bot/src ./apps/discord-bot/src

WORKDIR /app/apps/discord-bot
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Root package.json für Workspace-Setup
COPY package.json package-lock.json ./

# Shared Package für Production
COPY shared/package.json ./shared/
COPY --from=builder /app/shared/dist ./shared/dist

# App Package für Production
COPY apps/discord-bot/package*.json ./apps/discord-bot/

# Nur Production Dependencies installieren
RUN npm install --omit=dev

# Build-Artefakte kopieren
COPY --from=builder /app/apps/discord-bot/dist ./apps/discord-bot/dist

# Public Folder kopieren (falls benötigt für Bot-Ressourcen)
COPY apps/discord-bot/public ./apps/discord-bot/public

WORKDIR /app/apps/discord-bot

# Bot starten
CMD ["node", "dist/index.cjs"]
