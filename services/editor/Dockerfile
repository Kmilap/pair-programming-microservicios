# ============================================================
# Editor Colaborativo - Dockerfile
# ============================================================
# Día 3: imagen mínima Node 24 LTS con Express
# Día 4: se agregarán dependencias Yjs sin cambiar la base
# ============================================================

FROM node:24-alpine

WORKDIR /app

# Copiamos package.json primero para aprovechar cache de Docker
COPY package*.json ./
RUN npm install --omit=dev

# Después copiamos el código (cambia más seguido que las deps)
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]