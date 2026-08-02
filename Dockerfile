# ─── Rezeptbuch — Dockerfile ───────────────────────────────────────────────
# Statische Single-Page-App via nginx:alpine
# Build:  docker build -t rezeptbuch .
# Run:    docker run -p 8080:80 rezeptbuch
# ────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Nginx-Konfiguration
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# App-Dateien
COPY app/ /usr/share/nginx/html/

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

EXPOSE 80
