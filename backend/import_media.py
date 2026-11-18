"""Import Framia-generated training media into FirstShift.

Usage:  python -m backend.import_media <folder>
Expects files named <slug>.mp4|.webm|.mov (video), <slug>-poster.png|jpg (optional), <slug>-c<N>.png|jpg|webp (step cards).
Copies them into ./media and writes backend/seed/media.json.
"""
from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / "media"
MANIFEST = Path(__file__).resolve().parent / "seed" / "media.json"
SLUGS = {"greeting", "tea", "allergy", "handwash", "cold", "knife"}
VIDEO = {".mp4", ".webm", ".mov"}
IMAGE = {".png", ".jpg", ".jpeg", ".webp"}


def run(src: Path) -> dict:
    MEDIA.mkdir(exist_ok=True)
    manifest: dict = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    modules: dict = manifest.setdefault("modules", {})
    for f in sorted(src.iterdir()):
        ext = f.suffix.lower()
        stem = f.stem.lower()
        m = re.fullmatch(r"([a-z]+)(?:-(c\d+|poster))?", stem)
        if not m or m.group(1) not in SLUGS or (ext not in VIDEO and ext not in IMAGE):
            print("skip", f.name)
            continue
        slug, part = m.group(1), m.group(2)
        shutil.copy2(f, MEDIA / f.name)
        entry = modules.setdefault(slug, {"credit": "Framia by Converge.AI"})
        url = f"/media/{f.name}"
        if ext in VIDEO and part is None:
            entry["video"] = url
        elif part == "poster":
            entry["poster"] = url
        elif part and part.startswith("c") and ext in IMAGE:
            entry.setdefault("steps", {})[part] = url
        print("ok  ", slug, part or "video", "->", url)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest


if __name__ == "__main__":
    if len(sys.argv) != 2 or not Path(sys.argv[1]).is_dir():
        sys.exit("usage: python -m backend.import_media <folder with Framia files>")
    run(Path(sys.argv[1]))
