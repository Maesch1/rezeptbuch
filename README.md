# 📖 Rezeptbuch

Ein vollständiges Rezeptbuch als Docker-Container mit einer modernen Web-Oberfläche.

## 🚀 Schnellstart

### Voraussetzungen
- Docker & Docker Compose installiert

### Starten
```bash
git clone https://github.com/Maesch1/rezeptbuch.git
cd rezeptbuch
docker compose up -d
```

Die App ist danach unter **http://localhost:8080** erreichbar.

### Stoppen
```bash
docker compose down
```

### Rebuild nach Änderungen
```bash
docker compose up -d --build
```

## 📦 Funktionen

- ✅ Rezepte erstellen, bearbeiten, löschen
- ✅ Kategorien (Frühstück, Mittagessen, Abendessen, Dessert, Snacks)
- ✅ Zutatenliste mit Mengen & Einheiten
- ✅ Zubereitungsschritte
- ✅ Suche & Filterung
- ✅ Daten werden automatisch im Browser gespeichert (localStorage)
- ✅ Dark / Light Mode
- ✅ Vollständig responsive (Mobile & Desktop)

## 🐳 Docker Image manuell bauen
```bash
docker build -t rezeptbuch .
docker run -d -p 8080:80 --name rezeptbuch rezeptbuch
```

## 📁 Projektstruktur
```
rezeptbuch/
├── app/
│   └── index.html       # Single-Page-App (HTML + CSS + JS)
├── nginx/
│   └── nginx.conf       # Nginx Konfiguration
├── Dockerfile           # Container Build
├── docker-compose.yml   # Compose Setup
└── README.md
```
