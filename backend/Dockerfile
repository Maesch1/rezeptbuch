FROM node:20-alpine

WORKDIR /app

# Abhängigkeiten zuerst (besseres Layer-Caching)
COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./

# Daten-Verzeichnis
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

EXPOSE 3001
CMD ["node", "server.js"]
