FROM node:20-bookworm

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código
COPY . .

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Variables de entorno
ENV NODE_ENV=production
ENV HERMES_HOME=/opt/data

# Comando de inicio
CMD ["node", "server.js"]
