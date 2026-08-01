# 🍳 Rezeptbuch

Ein dockerisiertes Rezeptbuch mit persistentem Backend.

## Architektur

```
┌─────────────────────────────────┐
│         Docker Compose          │
│                                 │
│  ┌──────────┐  ┌─────────────┐  │
│  │  nginx   │  │  Flask API  │  │
│  │:8080→:80 │→ │   :5000     │  │
│  └──────────┘  └──────┬──────┘  │
│                        │        │
│                 ┌──────▼──────┐ │
│                 │  SQLite DB  │ │
│                 │  (Volume)   │ │
│                 └─────────────┘ │
└─────────────────────────────────┘
```

- **Frontend**: nginx serviert die statische HTML-App
- **Backend**: Python Flask REST-API (`/api/rezepte`)
- **Datenbank**: SQLite gespeichert in Docker Volume `rezepte-daten`
- **Daten bleiben erhalten** — auch nach `docker compose down`

## Schnellstart

```bash
git clone https://github.com/Maesch1/rezeptbuch.git
cd rezeptbuch
docker compose up -d --build
```

Dann im Browser: **http://localhost:8080**

## Befehle

| Aktion | Befehl |
|--------|--------|
| Starten | `docker compose up -d --build` |
| Stoppen | `docker compose down` |
| Logs anzeigen | `docker compose logs -f` |
| Status prüfen | `docker compose ps` |
| Daten sichern | `docker run --rm -v rezeptbuch_rezepte-daten:/data -v $(pwd):/backup alpine tar czf /backup/rezepte-backup.tar.gz /data` |
| Daten wiederherstellen | `docker run --rm -v rezeptbuch_rezepte-daten:/data -v $(pwd):/backup alpine tar xzf /backup/rezepte-backup.tar.gz -C /` |

## API Endpunkte

| Method | URL | Beschreibung |
|--------|-----|--------------|
| GET | `/api/rezepte` | Alle Rezepte laden |
| GET | `/api/rezepte?suche=pasta` | Rezepte suchen |
| GET | `/api/rezepte?kategorie=Dessert` | Nach Kategorie filtern |
| POST | `/api/rezepte` | Neues Rezept erstellen |
| PUT | `/api/rezepte/{id}` | Rezept bearbeiten |
| DELETE | `/api/rezepte/{id}` | Rezept löschen |
| GET | `/api/health` | API Status prüfen |

## Backup & Migration

Da die Daten in einem Docker Volume (`rezepte-daten`) gespeichert sind, kannst du sie einfach sichern und auf ein anderes Gerät übertragen:

```bash
# Backup erstellen
docker run --rm \
  -v rezeptbuch_rezepte-daten:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/rezepte-backup.tar.gz /data

# Auf neuem Gerät wiederherstellen
docker run --rm \
  -v rezeptbuch_rezepte-daten:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/rezepte-backup.tar.gz -C /
```
