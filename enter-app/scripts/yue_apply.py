"""Add Cantonese (yue) next to every Mandarin (zh) entry, using yue_strings.json.

- backend/seed/*.json: every {"en", "zh", ...} object gains "yue" right after "zh".
- TS files: every `en: "...", zh: "..."` object literal gains `yue: "..."` right after zh.
- Regenerates enter-app/supabase/functions/firstshift-api/seed_data.ts from the seed JSON.
Idempotent: entries that already have yue are left alone. Fails loudly on any untranslated string.
"""
import glob
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
APP = os.path.join(ROOT, "enter-app")
SEED = os.path.join(ROOT, "backend", "seed")
FN = os.path.join(APP, "supabase", "functions", "firstshift-api")
T = json.load(open(os.path.join(HERE, "yue_strings.json"), encoding="utf-8"))
missing = []


def tr(zh):
    if isinstance(zh, list):
        key = json.dumps(zh, ensure_ascii=False)
        if key not in T:
            missing.append(key)
            return zh
        return json.loads(T[key])
    if zh not in T:
        missing.append(zh)
        return zh
    return T[zh]


def add_yue(o):
    if isinstance(o, dict):
        if "en" in o and "zh" in o and "yue" not in o:
            new = {}
            for k, v in o.items():
                new[k] = v
                if k == "zh":
                    new["yue"] = tr(v)
            o.clear()
            o.update(new)
        for v in o.values():
            add_yue(v)
    elif isinstance(o, list):
        for v in o:
            add_yue(v)


# 1. Seed JSON
for f in sorted(glob.glob(os.path.join(SEED, "*.json"))):
    data = json.load(open(f, encoding="utf-8"))
    before = json.dumps(data, ensure_ascii=False)
    add_yue(data)
    if os.path.basename(f) == "roles.json":
        if not any(l["code"] == "yue" for l in data["languages"]):
            data["languages"].insert(2, {"code": "yue", "native": "粵語", "name": "Cantonese (Traditional)", "bcp47": "zh-HK"})
        data["pilot_languages"] = [l for l in data["pilot_languages"] if l["name"] != "Cantonese"]
    if json.dumps(data, ensure_ascii=False) != before:
        with open(f, "w", encoding="utf-8", newline="\n") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print("seed:", os.path.basename(f))

# 2. TS object literals
STR = r'"((?:[^"\\]|\\.)*)"'
PAIR = re.compile(r"(\ben:\s*" + STR + r",\s*zh:\s*" + STR + r")(?!\s*,\s*yue:)", re.S)
for rel in ["src/fs/lib/i18n.ts", "src/fs/pages/CoursePlayer.tsx", "src/fs/pages/Jobs.tsx",
            "src/fs/pages/HireDone.tsx", "src/fs/lib/api.ts", "supabase/functions/firstshift-api/core.ts"]:
    p = os.path.join(APP, rel)
    s = open(p, encoding="utf-8").read()

    def rep(m):
        zh = json.loads(f'"{m.group(3)}"')
        return m.group(1) + ", yue: " + json.dumps(tr(zh), ensure_ascii=False)

    n = PAIR.sub(rep, s)
    if n != s:
        open(p, "w", encoding="utf-8", newline="\n").write(n)
        print("ts:", rel)

if missing:
    raise SystemExit("Missing Cantonese for:\n" + "\n".join(sorted(set(missing))))

# 3. Regenerate seed_data.ts
def load(name):
    return json.load(open(os.path.join(SEED, name), encoding="utf-8"))


modules = load("modules_server.json")["modules"] + load("modules_kitchen.json")["modules"]
out = [
    "/* eslint-disable @typescript-eslint/no-explicit-any -- seed content is untyped JSON */",
    "// Generated from backend/seed/*.json. Sample training content; all people are fictional demo data.",
    "",
]
for name, val, typ in [("PEOPLE", load("people.json"), "any"), ("ROLES", load("roles.json"), "any"),
                       ("MOCK_AI", load("mock_ai.json"), "any"), ("MEDIA", load("media.json"), "any"),
                       ("MODULES", modules, "any[]")]:
    out += ["// deno-lint-ignore no-explicit-any", f"export const {name}: {typ} = {json.dumps(val, ensure_ascii=False)};", ""]
open(os.path.join(FN, "seed_data.ts"), "w", encoding="utf-8", newline="\n").write("\n".join(out))
print("regenerated seed_data.ts")
