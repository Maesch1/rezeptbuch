# 🍳 Rezeptbuch

Eine vollständige Rezeptbuch-WebApp mit **FastAPI Backend**, **SQLite Datenbank**, **Docker Volume** und **Bildupload**.

## 🏗️ Architektur

```
┌─────────────────┐     ┌──────────────────────┐
│  Browser        │────▶│  nginx (Port 8080)   │
│                 │     │  Frontend (HTML/JS)  │
└─────────────────┘     └──────────┬───────────┘
                                   │ /api/*  /bilder/*
                         ┌─────────▼──────────┐
                         │  FastAPI Backend   │
                         │  (Port 8000)       │
                         └─────────┬──────────┘
                                   │
                         ┌─────────▼──────────┐
                         │  Docker Volume     │
                         │  rezeptbuch_data/  │
                         │  ├── rezepte.db    │
                         │  └── bilder/       │
                         └────────────────────┘
```

## ✅ Features

- Rezepte erstellen, bearbeiten, löschen
- **Bildupload** (JPG/PNG/WEBP, max. 8 MB) — gespeichert auf Docker Volume
- **Einheiten-Dropdown** mit Gruppen: Volumen, Gewicht, Stück, **Gewürze**, Sonstiges
- Kategorien, Portionen, Kochzeit, Zubereitungsschritte, Notizen
- Suche & Kategorie-Filter
- Dark / Light Mode
- **SQLite Datenbank** auf persistentem Docker Volume → Daten überleben Container-Neustart

## 🚀 Starten

```bash
git clone https://github.com/Maesch1/rezeptbuch.git
cd rezeptbuch
docker compose up -d --build
```

Danach erreichbar unter: **http://localhost:8080**

## 🔄 Aktualisieren

```bash
git pull
docker compose up -d --build
```

## 📦 Volume

Das Volume `rezeptbuch_data` wird automatisch erstellt und enthält:
- `rezepte.db` – SQLite Datenbank mit allen Rezepten
- `bilder/` – Hochgeladene Bilder

Daten bleiben auch nach `docker compose down` erhalten.
Nur `docker compose down -v` löscht das Volume.

## 🛑 Stoppen

```bash
docker compose down        # Container stoppen (Daten bleiben)
docker compose down -v     # Container + Volume löschen
```

## 🗂️ Struktur

```
rezeptbuch/
├── docker-compose.yml       ← 2 Services + Volume
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt     ← FastAPI, Uvicorn
│   └── main.py              ← REST API
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf           ← Proxy /api → Backend
│   └── index.html           ← Single Page App
└── README.md
```
