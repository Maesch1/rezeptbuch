// ═══════════════════════════════════════════════════════════
//  Rezeptbuch — Backend  (Node.js + Express + sql.js)
// ═══════════════════════════════════════════════════════════
const express  = require('express');
const initSqlJs = require('sql.js');
const path     = require('path');
const fs       = require('fs');

const app    = express();
const PORT   = process.env.PORT   || 3001;
const DB_PATH = process.env.DB_PATH || '/data/rezeptbuch.db';

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// ─── Datenbank (sql.js) ─────────────────────────────────────
let db;

async function initDB() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
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
  saveDB();
  console.log('✅  Datenbank bereit:', DB_PATH);
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ─── sql.js Helfer ─────────────────────────────────────────
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  return all(sql, params)[0] || null;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDB();
}

// ─── Middleware ──────────────────────────────────────────
app.use(express.json({ limit: '15mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ─── Helper ──────────────────────────────────────────────
function getRezept(id) {
  const r = get('SELECT * FROM rezepte WHERE id = ?', [id]);
  if (!r) return null;
  r.zutaten  = all('SELECT * FROM zutaten  WHERE rezept_id = ? ORDER BY sort', [id]);
  r.schritte = all('SELECT text FROM schritte WHERE rezept_id = ? ORDER BY sort', [id]).map(s => s.text);
  return r;
}

// ─── Routes ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', db: DB_PATH }));

app.get('/api/rezepte', (req, res) => {
  const { suche, kategorie } = req.query;
  let sql = 'SELECT id,titel,kategorie,portionen,kochzeit,notizen,erstellt FROM rezepte WHERE 1=1';
  const params = [];
  if (suche)     { sql += ' AND (titel LIKE ? OR notizen LIKE ?)'; params.push(`%${suche}%`, `%${suche}%`); }
  if (kategorie) { sql += ' AND kategorie = ?'; params.push(kategorie); }
  sql += ' ORDER BY id DESC';
  const rows = all(sql, params);
  rows.forEach(r => {
    r.zutaten  = all('SELECT * FROM zutaten  WHERE rezept_id = ? ORDER BY sort', [r.id]);
    r.schritte = all('SELECT text FROM schritte WHERE rezept_id = ? ORDER BY sort', [r.id]).map(s => s.text);
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

  db.run(
    'INSERT INTO rezepte (titel,kategorie,portionen,kochzeit,notizen,bild) VALUES (?,?,?,?,?,?)',
    [titel.trim(), kategorie, portionen, kochzeit, notizen, bild]
  );
  const row = get('SELECT last_insert_rowid() as id');
  const id = row.id;

  zutaten.forEach((z, i)  => db.run('INSERT INTO zutaten  (rezept_id,menge,einheit,name,sort) VALUES (?,?,?,?,?)', [id, z.menge||'', z.einheit||'', z.name||'', i]));
  schritte.forEach((s, i) => db.run('INSERT INTO schritte (rezept_id,text,sort) VALUES (?,?,?)', [id, s, i]));
  saveDB();

  res.status(201).json(getRezept(id));
});

app.put('/api/rezepte/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!getRezept(id)) return res.status(404).json({ error: 'Nicht gefunden' });
  const { titel, kategorie, portionen, kochzeit, notizen, bild, zutaten=[], schritte=[] } = req.body;
  if (!titel?.trim()) return res.status(400).json({ error: 'Titel fehlt' });

  db.run(
    'UPDATE rezepte SET titel=?,kategorie=?,portionen=?,kochzeit=?,notizen=?,bild=? WHERE id=?',
    [titel.trim(), kategorie, portionen, kochzeit, notizen, bild??null, id]
  );
  db.run('DELETE FROM zutaten  WHERE rezept_id = ?', [id]);
  db.run('DELETE FROM schritte WHERE rezept_id = ?', [id]);
  zutaten.forEach((z, i)  => db.run('INSERT INTO zutaten  (rezept_id,menge,einheit,name,sort) VALUES (?,?,?,?,?)', [id, z.menge||'', z.einheit||'', z.name||'', i]));
  schritte.forEach((s, i) => db.run('INSERT INTO schritte (rezept_id,text,sort) VALUES (?,?,?)', [id, s, i]));
  saveDB();

  res.json(getRezept(id));
});

app.delete('/api/rezepte/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!getRezept(id)) return res.status(404).json({ error: 'Nicht gefunden' });
  db.run('DELETE FROM rezepte WHERE id = ?', [id]);
  saveDB();
  res.json({ ok: true, id });
});

// ─── Start ───────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () =>
    console.log(`✅  Rezeptbuch-API läuft auf Port ${PORT}`)
  );
}).catch(err => {
  console.error('❌  Datenbankfehler:', err);
  process.exit(1);
});
