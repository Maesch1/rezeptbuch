# 🍳 Rezeptbuch

Ein digitales Rezeptbuch als Docker-App mit persistenter Datenspeicherung.

## Architektur

```
┌─────────────────────────────────────────┐
│  Browser  →  http://localhost:8080       │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  nginx (Frontend)   │
        │  Port 80 → 8080     │
        └──────────┬──────────┘
                   │ /api/*
        ┌──────────▼──────────┐
        │  Node.js (Backend)  │
        │  Port 3001          │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  Docker Volume      │
        │  /data/recipes.json │
        └─────────────────────┘
```

## Quickstart

```bash
git clone https://github.com/Maesch1/rezeptbuch.git
cd rezeptbuch
docker compose up -d --build
```

Danach: **http://localhost:8080**

## Datenspeicherung

- Rezepte werden in `/data/recipes.json` im Docker Volume `rezeptbuch-data` gespeichert
- Das Volume überlebt Container-Neustarts und Updates
- Backup: `docker run --rm -v rezeptbuch-data:/data -v $(pwd):/backup alpine tar czf /backup/recipes-backup.tar.gz /data`

## Update

```bash
git pull
docker compose up -d --build
```

## Auf anderen Geräten im selben Netzwerk

Ersetze `localhost` durch die IP des Host-Rechners, z.B. `http://192.168.1.100:8080`

## Nützliche Befehle

```bash
# Logs anzeigen
docker compose logs -f

# Rezepte direkt anzeigen
docker exec rezeptbuch-backend cat /data/recipes.json

# Container stoppen
docker compose down

# Alles inkl. Daten löschen (Vorsicht!)
docker compose down -v
```
