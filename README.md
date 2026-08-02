# 🍳 Rezeptbuch

Eine moderne, responsive Single-Page-App für dein digitales Rezeptbuch.

## Architektur

```
┌─────────────────────────────────────────────────────┐
│  Browser  →  http://localhost:8080                  │
└──────────────────────┬──────────────────────────────┘
                       │
              ┌────────▼────────┐
              │   nginx:alpine  │  (Frontend + Reverse-Proxy)
              │   Port 80/8080  │
              └────────┬────────┘
                       │ /api/*
              ┌────────▼────────┐
              │  Node.js:3001   │  (Express REST-API)
              │  better-sqlite3 │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Docker Volume  │  rezept_data:/data/rezeptbuch.db
              └─────────────────┘
```

## Features

- Rezepte erstellen, bearbeiten und löschen
- Zutaten mit Menge, Einheit und Name
- Schritt-für-Schritt Zubereitung
- Foto-Upload pro Rezept
- Suche & Kategorie-Filter
- **Persistente Datenhaltung via SQLite** (Backend)
- Offline-Fallback via localStorage (kein Backend nötig)
- Dark / Light Mode
- Vollständig responsiv

---

## Schnellstart

### Voraussetzungen
- [Docker](https://docs.docker.com/get-docker/) ≥ 24.x
- [Docker Compose](https://docs.docker.com/compose/) ≥ 2.x

```bash
# Repository klonen
git clone https://github.com/Maesch1/rezeptbuch.git
cd rezeptbuch

# Container bauen und starten
docker compose up -d --build

# Im Browser öffnen
open http://localhost:8080
```

### Nützliche Befehle

| Befehl | Beschreibung |
|---|---|
| `docker compose up -d --build` | Bauen + starten |
| `docker compose down` | Stoppen + Container entfernen |
| `docker compose down -v` | Stoppen + **Daten löschen** |
| `docker compose logs -f` | Logs live anzeigen |
| `docker compose ps` | Status prüfen |
| `docker compose restart backend` | Backend neu starten |

---

## Projektstruktur

```
rezeptbuch/
├── backend/
│   ├── server.js           # Express REST-API
│   ├── package.json
│   └── Dockerfile          # node:20-alpine
├── frontend/
│   └── index.html          # SPA (HTML + CSS + JS)
├── nginx/
│   └── nginx.conf          # Reverse-Proxy + Static-Files
├── Dockerfile              # nginx:alpine (Frontend)
├── docker-compose.yml      # Orchestrierung
└── .dockerignore
```

---

## API-Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/api/rezepte` | Alle Rezepte (+ `?suche=&kategorie=`) |
| `GET` | `/api/rezepte/:id` | Einzelnes Rezept (mit Bild) |
| `POST` | `/api/rezepte` | Neues Rezept erstellen |
| `PUT` | `/api/rezepte/:id` | Rezept aktualisieren |
| `DELETE` | `/api/rezepte/:id` | Rezept löschen |
| `GET` | `/health` | Health-Check |

---

## Datenpersistenz

Rezepte werden in einer **SQLite-Datenbank** im Docker Volume `rezept_data` gespeichert.
Das Volume bleibt auch nach `docker compose down` erhalten — erst `docker compose down -v` löscht die Daten.

---

## Port ändern

In `docker-compose.yml`:
```yaml
ports:
  - "3000:80"  # ändere 8080 auf deinen Port
```

---

## Lizenz

MIT — frei verwendbar und anpassbar.
