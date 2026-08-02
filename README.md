# 🍳 Rezeptbuch

Ein Docker-Compose-Projekt mit:
- **Frontend**: nginx (statisch) + Reverse-Proxy
- **Backend**: Node.js + Express + SQLite
- **Persistenz**: Docker Volume `rezept_data`

## Struktur

```
rezeptbuch/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── index.html
```

## Starten

```bash
git clone https://github.com/Maesch1/rezeptbuch.git
cd rezeptbuch
docker compose up -d --build
```

Dann **http://localhost:8080** öffnen.

## Stoppen / Rebuild

```bash
# Stoppen
docker compose down

# Kompletter Neustart (nach git pull)
docker compose down && docker compose up -d --build
```

## Logs

```bash
docker compose logs -f          # alle
docker compose logs -f backend  # nur Backend
docker compose logs -f frontend # nur Frontend
```

## Features
- Rezepte erstellen, bearbeiten, löschen
- Foto-Upload (Base64, max. 8 MB)
- Zutaten mit Mengen und Einheiten
- Schritt-für-Schritt Zubereitung
- Suche und Kategorie-Filter
- PDF-Export (Browser-Druck)
- Dark / Light Mode
- Offline-Fallback (localStorage)
