const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const DATA_FILE = process.env.DATA_FILE || '/data/recipes.json';

// Sicherstellen dass /data existiert und recipes.json vorhanden ist
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function readRecipes() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeRecipes(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Bilder als Base64 können gross sein

// Alle Rezepte abrufen
app.get('/api/recipes', (req, res) => {
  res.json(readRecipes());
});

// Einzelnes Rezept abrufen
app.get('/api/recipes/:id', (req, res) => {
  const recipes = readRecipes();
  const recipe = recipes.find(r => r.id === req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Rezept nicht gefunden' });
  res.json(recipe);
});

// Neues Rezept erstellen
app.post('/api/recipes', (req, res) => {
  const recipes = readRecipes();
  const recipe = {
    ...req.body,
    id: req.body.id || crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  recipes.unshift(recipe);
  writeRecipes(recipes);
  res.status(201).json(recipe);
});

// Rezept aktualisieren
app.put('/api/recipes/:id', (req, res) => {
  let recipes = readRecipes();
  const idx = recipes.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Rezept nicht gefunden' });
  recipes[idx] = {
    ...req.body,
    id: req.params.id,
    createdAt: recipes[idx].createdAt,
    updatedAt: new Date().toISOString()
  };
  writeRecipes(recipes);
  res.json(recipes[idx]);
});

// Rezept löschen
app.delete('/api/recipes/:id', (req, res) => {
  let recipes = readRecipes();
  const idx = recipes.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Rezept nicht gefunden' });
  recipes.splice(idx, 1);
  writeRecipes(recipes);
  res.status(204).send();
});

// Health-Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', recipes: readRecipes().length }));

app.listen(PORT, () => {
  console.log(`Rezeptbuch Backend läuft auf Port ${PORT}`);
  console.log(`Datei: ${DATA_FILE}`);
  ensureDataFile();
});
