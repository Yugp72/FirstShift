"""SQLite access. One shared connection; all routes are async and run on the event loop thread."""
from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SCHEMA = """
CREATE TABLE IF NOT EXISTS job(
  id INTEGER PRIMARY KEY, role TEXT, title TEXT, location TEXT, pay_range TEXT, schedule TEXT,
  requirements TEXT, languages TEXT, notes TEXT, posts TEXT, closed INTEGER DEFAULT 0, created_at TEXT);
CREATE TABLE IF NOT EXISTS candidate(
  id INTEGER PRIMARY KEY, job_id INTEGER, ticket_no INTEGER, name TEXT, preferred_lang TEXT,
  source_channel TEXT, status TEXT, created_at TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS hire(
  id INTEGER PRIMARY KEY, candidate_id INTEGER UNIQUE, token TEXT UNIQUE, lang TEXT,
  started_at TEXT, stamped_at TEXT, stamped_by TEXT,
  sent_back_module_id INTEGER, sent_back_note TEXT, sent_back_note_original TEXT);
CREATE TABLE IF NOT EXISTS module(id INTEGER PRIMARY KEY, role TEXT, ord INTEGER, slug TEXT, content TEXT);
CREATE TABLE IF NOT EXISTS attempt(
  id INTEGER PRIMARY KEY, hire_id INTEGER, module_id INTEGER, question_id TEXT, answer TEXT,
  passed INTEGER, feedback TEXT, superseded INTEGER DEFAULT 0, created_at TEXT);
CREATE TABLE IF NOT EXISTS module_result(
  id INTEGER PRIMARY KEY, hire_id INTEGER, module_id INTEGER, passed INTEGER, score REAL,
  confidence INTEGER, updated_at TEXT, UNIQUE(hire_id, module_id));
"""

_conn: sqlite3.Connection | None = None


def db_path() -> Path:
    return Path(os.environ.get("FS_DB", ROOT / "data" / "firstshift.db"))


def get_conn() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        p = db_path()
        p.parent.mkdir(parents=True, exist_ok=True)
        _conn = sqlite3.connect(p, check_same_thread=False, isolation_level=None)
        _conn.row_factory = sqlite3.Row
        _conn.executescript(SCHEMA)
    return _conn


def close_conn() -> None:
    global _conn
    if _conn is not None:
        _conn.close()
        _conn = None


def rows(sql: str, *args) -> list[dict]:
    return [dict(r) for r in get_conn().execute(sql, args).fetchall()]


def row(sql: str, *args) -> dict | None:
    r = get_conn().execute(sql, args).fetchone()
    return dict(r) if r else None


def execute(sql: str, *args) -> int:
    cur = get_conn().execute(sql, args)
    return cur.lastrowid or 0


def now_iso(dt: datetime | None = None) -> str:
    return (dt or datetime.now(timezone.utc)).isoformat(timespec="seconds")


def parse_iso(s: str | None) -> datetime | None:
    return datetime.fromisoformat(s) if s else None


def modules_for(role: str) -> list[dict]:
    out = []
    for r in rows("SELECT id, content FROM module WHERE role=? ORDER BY ord", role):
        m = json.loads(r["content"])
        m["id"] = r["id"]
        out.append(m)
    return out


def module_by_id(module_id: int) -> dict | None:
    r = row("SELECT id, content FROM module WHERE id=?", module_id)
    if not r:
        return None
    m = json.loads(r["content"])
    m["id"] = r["id"]
    return m
