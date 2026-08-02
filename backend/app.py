import os
import sqlite3
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

DB_PATH = os.environ.get('DB_PATH', '/data/rezepte.db')


def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS rezepte (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            titel     TEXT    NOT NULL,
            kategorie TEXT    NOT NULL DEFAULT 'Sonstiges',
            portionen INTEGER NOT NULL DEFAULT 2,
            kochzeit  INTEGER NOT NULL DEFAULT 30,
            zutaten   TEXT    NOT NULL DEFAULT '[]',
            schritte  TEXT    NOT NULL DEFAULT '[]',
            notizen   TEXT    NOT NULL DEFAULT '',
            bild      TEXT    NOT NULL DEFAULT '',
            erstellt  TEXT    NOT NULL,
            geaendert TEXT    NOT NULL
        )
    ''')
    # Migration: bild-Spalte hinzufügen falls nicht vorhanden (bestehende DBs)
    try:
        conn.execute('ALTER TABLE rezepte ADD COLUMN bild TEXT NOT NULL DEFAULT ""')
        conn.commit()
    except Exception:
        pass
    conn.commit()
    conn.close()


def row_to_dict(row):
    d = dict(row)
    d['zutaten'] = json.loads(d['zutaten'])
    d['schritte'] = json.loads(d['schritte'])
    return d


@app.route('/')
def index():
    return send_from_directory('static', 'index.html')


@app.route('/api/health')
def health():
    return jsonify({'status': 'ok'})


@app.route('/api/rezepte', methods=['GET'])
def list_rezepte():
    suche = request.args.get('suche', '').strip()
    kategorie = request.args.get('kategorie', '').strip()
    conn = get_db()
    query = 'SELECT * FROM rezepte WHERE 1=1'
    params = []
    if suche:
        query += ' AND (titel LIKE ? OR notizen LIKE ?)'
        params += [f'%{suche}%', f'%{suche}%']
    if kategorie:
        query += ' AND kategorie = ?'
        params.append(kategorie)
    query += ' ORDER BY geaendert DESC'
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([row_to_dict(r) for r in rows])


@app.route('/api/rezepte', methods=['POST'])
def create_rezept():
    data = request.get_json(force=True)
    now = datetime.utcnow().isoformat()
    conn = get_db()
    cur = conn.execute(
        'INSERT INTO rezepte (titel,kategorie,portionen,kochzeit,zutaten,schritte,notizen,bild,erstellt,geaendert) VALUES (?,?,?,?,?,?,?,?,?,?)',
        (
            data.get('titel', 'Ohne Titel'),
            data.get('kategorie', 'Sonstiges'),
            data.get('portionen', 2),
            data.get('kochzeit', 30),
            json.dumps(data.get('zutaten', []), ensure_ascii=False),
            json.dumps(data.get('schritte', []), ensure_ascii=False),
            data.get('notizen', ''),
            data.get('bild', '') or '',
            now, now
        )
    )
    conn.commit()
    row = conn.execute('SELECT * FROM rezepte WHERE id=?', (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(row_to_dict(row)), 201


@app.route('/api/rezepte/<int:rid>', methods=['GET'])
def get_rezept(rid):
    conn = get_db()
    row = conn.execute('SELECT * FROM rezepte WHERE id=?', (rid,)).fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'Nicht gefunden'}), 404
    return jsonify(row_to_dict(row))


@app.route('/api/rezepte/<int:rid>', methods=['PUT'])
def update_rezept(rid):
    data = request.get_json(force=True)
    now = datetime.utcnow().isoformat()
    conn = get_db()
    conn.execute(
        'UPDATE rezepte SET titel=?,kategorie=?,portionen=?,kochzeit=?,zutaten=?,schritte=?,notizen=?,bild=?,geaendert=? WHERE id=?',
        (
            data.get('titel', 'Ohne Titel'),
            data.get('kategorie', 'Sonstiges'),
            data.get('portionen', 2),
            data.get('kochzeit', 30),
            json.dumps(data.get('zutaten', []), ensure_ascii=False),
            json.dumps(data.get('schritte', []), ensure_ascii=False),
            data.get('notizen', ''),
            data.get('bild', '') or '',
            now, rid
        )
    )
    conn.commit()
    row = conn.execute('SELECT * FROM rezepte WHERE id=?', (rid,)).fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'Nicht gefunden'}), 404
    return jsonify(row_to_dict(row))


@app.route('/api/rezepte/<int:rid>', methods=['DELETE'])
def delete_rezept(rid):
    conn = get_db()
    conn.execute('DELETE FROM rezepte WHERE id=?', (rid,))
    conn.commit()
    conn.close()
    return '', 204


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=False)
