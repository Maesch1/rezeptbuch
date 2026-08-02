# ─── Rezeptbuch — Frontend Dockerfile (nginx) ─────────────────
# Wird vom docker-compose.yml als 'frontend'-Service genutzt.
# Das Backend hat ein eigenes Dockerfile in ./backend/
# ──────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY frontend/index.html /usr/share/nginx/html/index.html

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

EXPOSE 80
