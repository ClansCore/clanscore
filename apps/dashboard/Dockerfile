# Multi-stage build für Angular Dashboard
FROM node:20-alpine AS builder

# Build-Tools für native Dependencies installieren
RUN apk update && apk add --no-cache python3 make g++

WORKDIR /app

# Root package.json für Workspace-Setup
COPY package.json package-lock.json ./

# Dashboard Package kopieren
COPY apps/dashboard/package*.json ./apps/dashboard/

# Dependencies installieren (mit Workspace-Support)
RUN npm install

# Dashboard Source kopieren
COPY apps/dashboard ./apps/dashboard

# Build-Argument für API URL (kann vollständige URL oder relativer Pfad sein)
ARG CLANSCORE_API_URL=http://localhost:3000/api
ENV CLANSCORE_API_URL=$CLANSCORE_API_URL

# Environment-Datei für Production erstellen
# Extrahiere den Pfad aus CLANSCORE_API_URL (z.B. /api aus http://localhost:3000/api)
# Wenn CLANSCORE_API_URL bereits mit / beginnt, verwende es direkt, sonst extrahiere den Pfad
WORKDIR /app/apps/dashboard
RUN node -e " \
    const url = process.env.CLANSCORE_API_URL || 'http://localhost:3000/api'; \
    let apiPath = '/api'; \
    if (url.startsWith('/')) { \
        apiPath = url; \
    } else { \
        try { \
            const urlObj = new URL(url); \
            apiPath = urlObj.pathname || '/api'; \
        } catch { \
            apiPath = '/api'; \
        } \
    } \
    require('fs').writeFileSync( \
        'src/environments/environment.production.ts', \
        \`export const environment = { production: true, apiUrl: '\${apiPath}' };\` \
    ); \
    "

# Build durchführen
RUN npm run build

# Production stage mit Nginx
FROM nginx:alpine

# Nginx Konfiguration kopieren
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf

# Build-Artefakte kopieren
COPY --from=builder /app/apps/dashboard/dist/dashboard/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

