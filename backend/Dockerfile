FROM node:20-alpine

# Build-Abhängigkeiten für better-sqlite3 (natives Modul)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

# Build-Tools wieder entfernen → kleineres Image
RUN apk del python3 make g++

COPY server.js ./

RUN mkdir -p /data

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -qO- http://localhost:3001/health || exit 1

EXPOSE 3001
CMD ["node", "server.js"]
