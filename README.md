# 🍳 Rezeptbuch

Eine einfache Rezeptbuch-WebApp im Docker Container.
Rezepte werden **automatisch im Browser (localStorage)** gespeichert – kein Backend nötig.

## ✅ Features

- Rezepte erstellen, bearbeiten, löschen
- **Bild pro Rezept** hochladen (wird als Base64 gespeichert)
- **Einheiten** mit Gruppen: Volumen, Gewicht, Stück, **Gewürze** (Prise, Msp., nach Geschmack…)
- Kategorien, Portionen, Kochzeit
- Suche & Kategorie-Filter
- Dark / Light Mode
- Automatisches Speichern im localStorage

## 🚀 Starten

```bash
git clone https://github.com/Maesch1/rezeptbuch.git
cd rezeptbuch
docker compose up -d
```

Danach erreichbar unter: **http://localhost:8080**

## 🔄 Aktualisieren

```bash
git pull
docker compose up -d --build
```

## 📦 Daten

Alle Rezepte werden im `localStorage` des Browsers gespeichert (`rezeptbuch_v2`).
Kein Datenverlust beim Container-Neustart – die Daten bleiben im Browser.
