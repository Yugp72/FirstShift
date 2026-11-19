"""Collect every Mandarin (zh) string, with its English source, that needs a Cantonese (yue) version.

Writes yue_todo.json: {zh_string: en_string}. Translations live in yue_strings.json: {zh_string: yue_string}.
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
APP = os.path.join(ROOT, "enter-app")
SEED = os.path.join(ROOT, "backend", "seed")
TS_FILES = [
    "src/fs/lib/i18n.ts", "src/fs/pages/CoursePlayer.tsx", "src/fs/pages/Jobs.tsx",
    "src/fs/pages/HireDone.tsx", "src/fs/lib/api.ts", "supabase/functions/firstshift-api/core.ts",
]
STR = r'"((?:[^"\\]|\\.)*)"'
PAIR = re.compile(r"\ben:\s*" + STR + r",\s*zh:\s*" + STR, re.S)


def seed_pairs(o, out):
    if isinstance(o, dict):
        if "en" in o and "zh" in o:
            zh, en = o["zh"], o["en"]
            if isinstance(zh, str):
                out[zh] = en
            elif isinstance(zh, list):  # keyword lists: translate as a whole list
                out[json.dumps(zh, ensure_ascii=False)] = json.dumps(en, ensure_ascii=False)
        for v in o.values():
            seed_pairs(v, out)
    elif isinstance(o, list):
        for v in o:
            seed_pairs(v, out)


def main():
    todo = {}
    for f in sorted(glob.glob(os.path.join(SEED, "*.json"))):
        seed_pairs(json.load(open(f, encoding="utf-8")), todo)
    for rel in TS_FILES:
        s = open(os.path.join(APP, rel), encoding="utf-8").read()
        for en, zh in PAIR.findall(s):
            todo[json.loads(f'"{zh}"')] = json.loads(f'"{en}"')
    done = {}
    p = os.path.join(os.path.dirname(__file__), "yue_strings.json")
    if os.path.exists(p):
        done = json.load(open(p, encoding="utf-8"))
    missing = {k: v for k, v in todo.items() if k not in done}
    json.dump(missing, open(os.path.join(os.path.dirname(__file__), "yue_todo.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(f"{len(todo)} strings, {len(missing)} still need Cantonese", file=sys.stderr)


if __name__ == "__main__":
    main()
