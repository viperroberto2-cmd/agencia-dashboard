FROM node:20-bookworm

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    git curl wget \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY dashboard/package*.json ./dashboard/

# Instalar dependencias de Node
RUN npm ci && cd dashboard && npm ci && cd ..

# Instalar Hermes CLI
RUN pip3 install --no-cache-dir hermes-agent

# Copiar código
COPY . .

# Crear directorio para datos
RUN mkdir -p /opt/data

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV HERMES_HOME=/opt/data
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicio
CMD ["sh", "-c", "cd /app/dashboard && npm start"]
