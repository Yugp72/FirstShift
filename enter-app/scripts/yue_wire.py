"""One-off wiring for Cantonese beyond string tables (language lists, locales, the 粵語 chat post)."""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
APP = os.path.join(ROOT, "enter-app")


def edit(rel, pairs):
    p = os.path.join(APP, rel)
    s = open(p, encoding="utf-8").read()
    for a, b in pairs:
        if b in s and a not in s:
            continue  # already applied
        assert a in s, (rel, a[:80])
        s = s.replace(a, b, 1)
    open(p, "w", encoding="utf-8", newline="\n").write(s)
    print("wired", rel)


CORE = "supabase/functions/firstshift-api/core.ts"
edit(CORE, [
    ('const LANGS = ["en", "zh", "es"];', 'const LANGS = ["en", "zh", "yue", "es"];'),
    ('const ALL_CHANNELS = ["job_board", "classifieds", "chat_zh", "chat_es", "flyer", "bilingual", "easy_read"];',
     'const ALL_CHANNELS = ["job_board", "classifieds", "chat_zh", "chat_yue", "chat_es", "flyer", "bilingual", "easy_read"];'),
    ('const sep = lang === "zh" ? "、" : ", ";', 'const sep = lang === "zh" || lang === "yue" ? "、" : ", ";'),
    ('  const notes = (job.notes || "").trim() ? `\\n${job.notes.trim()}\\n` : "";',
     '  const notes = (job.notes || "").trim() ? `\\n${job.notes.trim()}\\n` : "";\n'
     '  const natives = langs.map((x) => LANG_NAMES[x]).filter(Boolean);\n'
     '  const trainIn = natives.length > 1 ? `${natives.slice(0, -1).join(", ")} or ${natives[natives.length - 1]}` : natives[0] || "English";'),
    ('`No résumé needed. Training in English, 中文 or Español.\\n${notes}', '`No résumé needed. Training in ${trainIn}.\\n${notes}'),
    ('''  if (langs.includes("es")) {
    texts.chat_es''', '''  if (langs.includes("yue")) {
    texts.chat_yue = ["yue",
      `【請人】${pick(role.title, "yue")} 📍${job.location}\\n💰 ${pay}\\n🗓 ${sched}\\n${reqLines("yue", "✅ ")}\\n` +
      "歡迎識講廣東話、普通話、英文嘅朋友！提供廣東話培訓。\\n有興趣請回覆你個名同可以返工嘅時間 🙏"];
  }
  if (langs.includes("es")) {
    texts.chat_es'''),
    ("No experience? We'll train you, in English, 中文 or Español. Ask any of our team.", "No experience? We'll train you, in ${trainIn}. Ask any of our team."),
    ('const label = ({ zh: "中文", es: "Español" } as Record<string, string>)[o] || o;', 'const label = LANG_NAMES[o] || o;'),
    ('(o === "zh" ? `招聘：${pick(role.title, o)}\\n` : `SE BUSCA: ${pick(role.title, o)}\\n`)',
     '(o === "zh" ? `招聘：${pick(role.title, o)}\\n` : o === "yue" ? `請人：${pick(role.title, o)}\\n` : `SE BUSCA: ${pick(role.title, o)}\\n`)'),
    ('"We will train you.\\nYou can learn in English, Chinese or Spanish.\\nYou do not need a résumé.', '`We will train you.\\nYou can learn in ${trainIn}.\\nYou do not need a résumé.` + "'),
    ('    chat_es: "chat_es: WhatsApp-style post in Spanish, a few emoji, <=350 chars",',
     '    chat_yue: "chat_yue: WhatsApp-style post in written Cantonese (Traditional Chinese, Hong Kong usage), a few emoji, <=350 chars",\n'
     '    chat_es: "chat_es: WhatsApp-style post in Spanish, a few emoji, <=350 chars",'),
    ('["chat_zh", "chat_es", "bilingual"]', '["chat_zh", "chat_yue", "chat_es", "bilingual"]'),
    ('const loc = lang === "zh" ? "zh-CN" : lang === "es" ? "es-ES" : "en-US";',
     'const loc = lang === "zh" ? "zh-CN" : lang === "yue" ? "zh-HK" : lang === "es" ? "es-ES" : "en-US";'),
    ('languages: (b.languages?.length ? b.languages : ["en", "zh", "es"])', 'languages: (b.languages?.length ? b.languages : ["en", "zh", "yue", "es"])'),
])

edit("src/fs/lib/api.ts", [('export type Lang = "en" | "zh" | "es";', 'export type Lang = "en" | "zh" | "yue" | "es";')])
edit("src/fs/components/Ticket.tsx", [('lang={t.lang === "zh" ? "zh-CN" : undefined}', 'lang={t.lang === "zh" ? "zh-CN" : t.lang === "yue" ? "zh-HK" : undefined}')])
edit("src/fs/pages/CoursePlayer.tsx", [('{ code: "zh", native: "中文" }, { code: "es", native: "Español" }];',
                                        '{ code: "zh", native: "中文" }, { code: "yue", native: "粵語" }, { code: "es", native: "Español" }];')])
edit("src/fs/pages/Login.tsx", [('[["en", "English"], ["zh", "中文"], ["es", "Español"]]', '[["en", "English"], ["zh", "中文"], ["yue", "粵語"], ["es", "Español"]]'),
                                ('lang={c === "zh" ? "zh-CN" : c}', 'lang={c === "zh" ? "zh-CN" : c === "yue" ? "zh-HK" : c}')])
edit("src/fs/pages/ManagerOrderIn.tsx", [('const LANG_ATTR: Record<string, string | undefined> = { zh: "zh-CN", es: "es", en: "en" };',
                                          'const LANG_ATTR: Record<string, string | undefined> = { zh: "zh-CN", yue: "zh-HK", es: "es", en: "en" };'),
                                         ('useState<Lang[]>(["en", "zh", "es"])', 'useState<Lang[]>(["en", "zh", "yue", "es"])'),
                                         ("Seven channels in English, 中文 and Español, plus task cards.", "Every channel in English, 中文, 粵語 and Español, plus task cards.")])

# roles.json: the 粵語 chat channel
p = os.path.join(ROOT, "backend", "seed", "roles.json")
r = json.load(open(p, encoding="utf-8"))
if "chat_yue" not in r["channels"]:
    ch = {}
    for k, v in r["channels"].items():
        ch[k] = v
        if k == "chat_zh":
            ch["chat_yue"] = {"label": "WhatsApp message", "kind": "Group chat post, 粵語", "limit": 500, "format_note": "Short lines, emoji markers"}
    r["channels"] = ch
    with open(p, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(r, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    print("wired roles.json chat_yue")
