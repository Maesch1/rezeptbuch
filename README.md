# 🍳 Rezeptbuch

Eine moderne, responsive Single-Page-App für dein digitales Rezeptbuch — läuft vollständig in einem Docker-Container auf Basis von **nginx:alpine**.

## ✨ Features

- Rezepte erstellen, bearbeiten und löschen
- Zutaten mit Menge, Einheit und Name
- Schritt-für-Schritt Zubereitung
- Foto-Upload pro Rezept
- Suche & Kategorie-Filter
- Automatisches Speichern via `localStorage`
- Dark / Light Mode
- Vollständig responsiv (Mobile + Desktop)

---

## 🚀 Schnellstart

### Voraussetzungen
- [Docker](https://docs.docker.com/get-docker/) ≥ 24.x
- [Docker Compose](https://docs.docker.com/compose/) ≥ 2.x

### Container starten

```bash
# 1. Repository klonen
git clone https://github.com/Maesch1/rezeptbuch.git
cd rezeptbuch

# 2. Container bauen und starten
docker compose up -d --build

# 3. Im Browser öffnen
open http://localhost:8080
```

### Nützliche Befehle

| Befehl | Beschreibung |
|---|---|
| `docker compose up -d --build` | Bauen + starten |
| `docker compose up -d` | Starten (ohne rebuild) |
| `docker compose down` | Stoppen + Container entfernen |
| `docker compose logs -f` | Logs live anzeigen |
| `docker compose ps` | Status prüfen |

---

## 🏗️ Projektstruktur

```
rezeptbuch/
├── app/
│   └── index.html          # Komplette SPA (HTML + CSS + JS)
├── nginx/
│   └── nginx.conf          # nginx-Konfiguration
├── Dockerfile              # nginx:alpine Container
├── docker-compose.yml      # Compose-Konfiguration
└── .dockerignore
```

---

## 💾 Datenpersistenz

Rezepte werden im **`localStorage`** des Browsers gespeichert — d.h. sie bleiben erhalten, solange du den Browser-Cache nicht löschst. Die Daten sind lokal auf deinem Gerät.

> **Tipp:** Für ein produktives Setup mit Backend-Persistenz (z.B. PostgreSQL + Node.js API) kann das Projekt einfach erweitert werden.

---

## 🔧 Konfiguration

### Port ändern

In `docker-compose.yml`:
```yaml
ports:
  - "3000:80"   # Ändere 8080 auf deinen gewünschten Port
```

### Produktiv-Deployment

Für ein Produktiv-Deployment empfiehlt sich ein Reverse-Proxy (z.B. Traefik oder nginx-proxy) vor dem Container.

---

## 📝 Lizenz

MIT — frei verwendbar und anpassbar.
