# Multi-stage build para optimizar tamaño final
FROM node:22.13.1 AS dependencies

# Instalar dependencias del sistema necesarias para compilar módulos nativos
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Stage para construcción
FROM node:22.13.1 AS build

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para build)
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar TypeScript a JavaScript
RUN npm run build

# Stage final para producción
FROM node:22.13.1 AS production

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init

# Crear usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Crear directorio para uploads con permisos correctos
RUN mkdir -p public/uploads && \
    chown -R nestjs:nodejs public/

# Copiar dependencias de producción desde stage dependencies
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copiar aplicación compilada desde stage build
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./

# Cambiar al usuario no-root
USER nestjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Usar dumb-init para manejo correcto de señales del sistema
ENTRYPOINT ["dumb-init", "--"]

# Comando por defecto
CMD ["node", "dist/main.js"]