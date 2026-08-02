import os
import sqlite3
import json
import shutil
import uuid
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel

DATA_DIR = Path(os.getenv("DATA_DIR", "./data"))
DB_PATH  = DATA_DIR / "rezepte.db"
BILD_DIR = DATA_DIR / "bilder"

DATA_DIR.mkdir(parents=True, exist_ok=True)
BILD_DIR.mkdir(parents=True, exist_ok=True)

# ── Datenbank ──────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS rezepte (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                titel     TEXT    NOT NULL,
                kategorie TEXT    NOT NULL DEFAULT 'Sonstiges',
                portionen INTEGER NOT NULL DEFAULT 2,
                kochzeit  INTEGER NOT NULL DEFAULT 30,
                zutaten   TEXT    NOT NULL DEFAULT '[]',
                schritte  TEXT    NOT NULL DEFAULT '[]',
                notizen   TEXT    NOT NULL DEFAULT '',
                bild      TEXT,
                erstellt  TEXT    NOT NULL DEFAULT (datetime('now'))
            )
        """)
        conn.commit()

init_db()

# ── App ────────────────────────────────────────────────────
app = FastAPI(title="Rezeptbuch API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Bilder statisch ausliefern
app.mount("/bilder", StaticFiles(directory=str(BILD_DIR)), name="bilder")

# ── Modelle ────────────────────────────────────────────────
class Zutat(BaseModel):
    menge:   str = ""
    einheit: str = ""
    name:    str = ""

class RezeptIn(BaseModel):
    titel:     str
    kategorie: str = "Sonstiges"
    portionen: int = 2
    kochzeit:  int = 30
    zutaten:   List[Zutat] = []
    schritte:  List[str]   = []
    notizen:   str         = ""
    bild:      Optional[str] = None  # Dateiname (wird beim Upload gesetzt)

# ── Hilfsfunktion ──────────────────────────────────────────
def row_to_dict(row):
    d = dict(row)
    d["zutaten"]  = json.loads(d["zutaten"]  or "[]")
    d["schritte"] = json.loads(d["schritte"] or "[]")
    if d["bild"]:
        d["bild_url"] = f"/bilder/{d['bild']}"
    else:
        d["bild_url"] = None
    return d

# ── Endpunkte ──────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok"}

# Alle Rezepte
@app.get("/api/rezepte")
def liste_rezepte():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM rezepte ORDER BY id DESC").fetchall()
    return [row_to_dict(r) for r in rows]

# Einzelnes Rezept
@app.get("/api/rezepte/{rezept_id}")
def get_rezept(rezept_id: int):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM rezepte WHERE id=?", (rezept_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Rezept nicht gefunden")
    return row_to_dict(row)

# Rezept erstellen (JSON, ohne Bild)
@app.post("/api/rezepte", status_code=201)
def create_rezept(r: RezeptIn):
    with get_db() as conn:
        cur = conn.execute(
            """INSERT INTO rezepte (titel,kategorie,portionen,kochzeit,zutaten,schritte,notizen,bild)
               VALUES (?,?,?,?,?,?,?,?)""",
            (r.titel, r.kategorie, r.portionen, r.kochzeit,
             json.dumps([z.dict() for z in r.zutaten]),
             json.dumps(r.schritte), r.notizen, r.bild)
        )
        conn.commit()
        new_id = cur.lastrowid
    return get_rezept(new_id)

# Rezept aktualisieren (JSON, ohne Bild)
@app.put("/api/rezepte/{rezept_id}")
def update_rezept(rezept_id: int, r: RezeptIn):
    with get_db() as conn:
        row = conn.execute("SELECT bild FROM rezepte WHERE id=?", (rezept_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Rezept nicht gefunden")
        # Wenn kein neues Bild übergeben wird, altes behalten
        bild = r.bild if r.bild is not None else row["bild"]
        conn.execute(
            """UPDATE rezepte SET titel=?,kategorie=?,portionen=?,kochzeit=?,
               zutaten=?,schritte=?,notizen=?,bild=? WHERE id=?""",
            (r.titel, r.kategorie, r.portionen, r.kochzeit,
             json.dumps([z.dict() for z in r.zutaten]),
             json.dumps(r.schritte), r.notizen, bild, rezept_id)
        )
        conn.commit()
    return get_rezept(rezept_id)

# Bild hochladen (multipart)
@app.post("/api/rezepte/{rezept_id}/bild")
async def upload_bild(rezept_id: int, file: UploadFile = File(...)):
    with get_db() as conn:
        row = conn.execute("SELECT bild FROM rezepte WHERE id=?", (rezept_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Rezept nicht gefunden")

    # Altes Bild löschen
    if row["bild"]:
        old = BILD_DIR / row["bild"]
        if old.exists():
            old.unlink()

    # Neues Bild speichern
    ext = Path(file.filename).suffix.lower() or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = BILD_DIR / filename
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    with get_db() as conn:
        conn.execute("UPDATE rezepte SET bild=? WHERE id=?", (filename, rezept_id))
        conn.commit()

    return {"bild": filename, "bild_url": f"/bilder/{filename}"}

# Rezept löschen
@app.delete("/api/rezepte/{rezept_id}", status_code=204)
def delete_rezept(rezept_id: int):
    with get_db() as conn:
        row = conn.execute("SELECT bild FROM rezepte WHERE id=?", (rezept_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Rezept nicht gefunden")
        if row["bild"]:
            p = BILD_DIR / row["bild"]
            if p.exists():
                p.unlink()
        conn.execute("DELETE FROM rezepte WHERE id=?", (rezept_id,))
        conn.commit()
