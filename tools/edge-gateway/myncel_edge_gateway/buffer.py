from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path
from typing import Iterable

from .models import Reading


class OfflineBuffer:
    """SQLite-backed store-and-forward queue."""

    def __init__(self, path: str = "myncel_edge_gateway_buffer.sqlite3") -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True) if self.path.parent != Path(".") else None
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(str(self.path))

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS readings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    payload TEXT NOT NULL,
                    created_at REAL NOT NULL
                )
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_readings_created_at ON readings(created_at)")

    def add_many(self, readings: Iterable[Reading]) -> int:
        payloads = [(json.dumps(r.to_ingest_dict()), time.time()) for r in readings]
        if not payloads:
            return 0
        with self._connect() as conn:
            conn.executemany("INSERT INTO readings(payload, created_at) VALUES (?, ?)", payloads)
        return len(payloads)

    def peek(self, limit: int = 100) -> list[tuple[int, dict]]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT id, payload FROM readings ORDER BY id ASC LIMIT ?",
                (int(limit),),
            ).fetchall()
        return [(int(row[0]), json.loads(row[1])) for row in rows]

    def delete_ids(self, ids: Iterable[int]) -> None:
        id_list = [int(x) for x in ids]
        if not id_list:
            return
        placeholders = ",".join("?" for _ in id_list)
        with self._connect() as conn:
            conn.execute(f"DELETE FROM readings WHERE id IN ({placeholders})", id_list)

    def count(self) -> int:
        with self._connect() as conn:
            row = conn.execute("SELECT COUNT(*) FROM readings").fetchone()
        return int(row[0])
