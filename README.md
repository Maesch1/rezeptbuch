# 🍳 Rezeptbuch

Ein dockerisiertes Rezeptbuch — **ein einzelner Container**, Flask serviert Frontend + API, SQLite speichert die Daten persistent in einem Docker Volume.

## Schnellstart

```bash
git clone https://github.com/Maesch1/rezeptbuch.git
cd rezeptbuch
```

### Option A — Docker Compose (empfohlen)
```bash
docker compose up -d --build
```

### Option B — Einzelner docker run Befehl
```bash
docker build -t rezeptbuch .
docker run -d -p 8080:5000 -v rezepte-daten:/data --name rezeptbuch rezeptbuch
```

Dann im Browser: **http://localhost:8080**

## Befehle

| Aktion | Compose | Docker |
|--------|---------|--------|
| Starten | `docker compose up -d --build` | `docker run -d -p 8080:5000 -v rezepte-daten:/data --name rezeptbuch rezeptbuch` |
| Stoppen | `docker compose down` | `docker stop rezeptbuch` |
| Logs | `docker compose logs -f` | `docker logs -f rezeptbuch` |
| Status | `docker compose ps` | `docker ps` |
| Neu bauen | `docker compose up -d --build` | `docker build -t rezeptbuch . && docker rm -f rezeptbuch && docker run ...` |

## Daten sichern & migrieren

```bash
# Backup erstellen
docker run --rm \
  -v rezepte-daten:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/rezepte-backup.tar.gz /data

# Auf neuem Gerät wiederherstellen
docker run --rm \
  -v rezepte-daten:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/rezepte-backup.tar.gz -C /
```

## Architektur

```
[ Browser :8080 ] → [ Flask Container ] → [ SQLite /data/rezepte.db ]
                        ↓                         ↑
                   /          → index.html    Docker Volume
                   /api/rezepte → REST-API     (rezepte-daten)
```

## API Endpunkte

| Method | URL | Beschreibung |
|--------|-----|--------------|
| GET | `/api/health` | Status prüfen |
| GET | `/api/rezepte` | Alle Rezepte |
| GET | `/api/rezepte?suche=pasta` | Suche |
| POST | `/api/rezepte` | Neues Rezept |
| PUT | `/api/rezepte/{id}` | Bearbeiten |
| DELETE | `/api/rezepte/{id}` | Löschen |
