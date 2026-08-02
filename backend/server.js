// ═══════════════════════════════════════════════════════════
//  Rezeptbuch — Backend  (Node.js + Express + better-sqlite3)
// ═══════════════════════════════════════════════════════════
const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || '/data/rezeptbuch.db';

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// ─── Datenbank ────────────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS rezepte (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    titel      TEXT    NOT NULL,
    kategorie  TEXT    NOT NULL DEFAULT 'Sonstiges',
    portionen  INTEGER NOT NULL DEFAULT 2,
    kochzeit   INTEGER NOT NULL DEFAULT 30,
    notizen    TEXT    DEFAULT '',
    bild       TEXT    DEFAULT NULL,
    erstellt   TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS zutaten (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    rezept_id  INTEGER NOT NULL REFERENCES rezepte(id) ON DELETE CASCADE,
    menge      TEXT    DEFAULT '',
    einheit    TEXT    DEFAULT '',
    name       TEXT    NOT NULL,
    sort       INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS schritte (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    rezept_id  INTEGER NOT NULL REFERENCES rezepte(id) ON DELETE CASCADE,
    text       TEXT    NOT NULL,
    sort       INTEGER DEFAULT 0
  );
`);

// ─── Middleware ───────────────────────────────────────────
app.use(express.json({ limit: '15mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ─── Helper ───────────────────────────────────────────────
function getRezept(id) {
  const r = db.prepare('SELECT * FROM rezepte WHERE id = ?').get(id);
  if (!r) return null;
  r.zutaten  = db.prepare('SELECT * FROM zutaten  WHERE rezept_id = ? ORDER BY sort').all(id);
  r.schritte = db.prepare('SELECT text FROM schritte WHERE rezept_id = ? ORDER BY sort').all(id).map(s => s.text);
  return r;
}

// ─── Routes ───────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', db: DB_PATH }));

app.get('/api/rezepte', (req, res) => {
  const { suche, kategorie } = req.query;
  let sql = 'SELECT id,titel,kategorie,portionen,kochzeit,notizen,erstellt FROM rezepte WHERE 1=1';
  const params = [];
  if (suche)     { sql += ' AND (titel LIKE ? OR notizen LIKE ?)'; params.push(`%${suche}%`, `%${suche}%`); }
  if (kategorie) { sql += ' AND kategorie = ?'; params.push(kategorie); }
  sql += ' ORDER BY id DESC';
  const rows = db.prepare(sql).all(...params);
  rows.forEach(r => {
    r.zutaten  = db.prepare('SELECT * FROM zutaten  WHERE rezept_id = ? ORDER BY sort').all(r.id);
    r.schritte = db.prepare('SELECT text FROM schritte WHERE rezept_id = ? ORDER BY sort').all(r.id).map(s => s.text);
  });
  res.json(rows);
});

app.get('/api/rezepte/:id', (req, res) => {
  const r = getRezept(Number(req.params.id));
  if (!r) return res.status(404).json({ error: 'Nicht gefunden' });
  res.json(r);
});

app.post('/api/rezepte', (req, res) => {
  const { titel, kategorie='Sonstiges', portionen=2, kochzeit=30,
          notizen='', bild=null, zutaten=[], schritte=[] } = req.body;
  if (!titel?.trim()) return res.status(400).json({ error: 'Titel fehlt' });
  const info = db.prepare(
    'INSERT INTO rezepte (titel,kategorie,portionen,kochzeit,notizen,bild) VALUES (?,?,?,?,?,?)'
  ).run(titel.trim(), kategorie, portionen, kochzeit, notizen, bild);
  const id = info.lastInsertRowid;
  const insZ = db.prepare('INSERT INTO zutaten (rezept_id,menge,einheit,name,sort) VALUES (?,?,?,?,?)');
  const insS = db.prepare('INSERT INTO schritte (rezept_id,text,sort) VALUES (?,?,?)');
  db.transaction(() => {
    zutaten.forEach((z, i) => insZ.run(id, z.menge||'', z.einheit||'', z.name||'', i));
    schritte.forEach((s, i) => insS.run(id, s, i));
  })();
  res.status(201).json(getRezept(id));
});

app.put('/api/rezepte/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!getRezept(id)) return res.status(404).json({ error: 'Nicht gefunden' });
  const { titel, kategorie, portionen, kochzeit, notizen, bild, zutaten=[], schritte=[] } = req.body;
  if (!titel?.trim()) return res.status(400).json({ error: 'Titel fehlt' });
  db.prepare(
    'UPDATE rezepte SET titel=?,kategorie=?,portionen=?,kochzeit=?,notizen=?,bild=? WHERE id=?'
  ).run(titel.trim(), kategorie, portionen, kochzeit, notizen, bild??null, id);
  const insZ = db.prepare('INSERT INTO zutaten (rezept_id,menge,einheit,name,sort) VALUES (?,?,?,?,?)');
  const insS = db.prepare('INSERT INTO schritte (rezept_id,text,sort) VALUES (?,?,?)');
  db.transaction(() => {
    db.prepare('DELETE FROM zutaten  WHERE rezept_id = ?').run(id);
    db.prepare('DELETE FROM schritte WHERE rezept_id = ?').run(id);
    zutaten.forEach((z, i) => insZ.run(id, z.menge||'', z.einheit||'', z.name||'', i));
    schritte.forEach((s, i) => insS.run(id, s, i));
  })();
  res.json(getRezept(id));
});

app.delete('/api/rezepte/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!getRezept(id)) return res.status(404).json({ error: 'Nicht gefunden' });
  db.prepare('DELETE FROM rezepte WHERE id = ?').run(id);
  res.json({ ok: true, id });
});

app.listen(PORT, '0.0.0.0', () => console.log(`✅  Rezeptbuch-API läuft auf Port ${PORT}`));
