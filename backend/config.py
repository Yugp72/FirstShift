"""Load KEY=VALUE pairs from the repo-root .env into os.environ. Real environment variables win."""
from __future__ import annotations

import os
from pathlib import Path

_ENV = Path(__file__).resolve().parent.parent / ".env"


def load_env(path: Path = _ENV) -> None:
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip().strip('"').strip("'")
        if key and value and key not in os.environ:
            os.environ[key] = value


load_env()
