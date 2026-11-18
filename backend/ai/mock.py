"""MockProvider: deterministic, zero network. Default for build, tests and the judge deploy."""
from __future__ import annotations

import json
import math
import unicodedata
from pathlib import Path

from ..i18n import pick, t
from .base import ALL_CHANNELS, ChannelPost, Grade, JobInput, RubricPoint

SEED = Path(__file__).resolve().parent.parent / "seed"


def _load(name: str) -> dict:
    return json.loads((SEED / name).read_text(encoding="utf-8"))


def normalize(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    return s.lower()


class MockProvider:
    name = "mock"

    def __init__(self) -> None:
        self.mock = _load("mock_ai.json")
        self.roles = _load("roles.json")

    # ---------- grading ----------
    def grade_answer(self, question: str, rubric: list[RubricPoint], answer: str, lang: str) -> Grade:
        text = normalize(answer)
        kw_table = self.mock["rubric_keywords"]
        matched: list[str] = []
        for p in rubric:
            per_lang = kw_table.get(p.id, {})
            # The hire may answer in any language, so match keywords from every language.
            keywords = [k for words in per_lang.values() for k in words]
            if any(normalize(k) in text for k in keywords):
                matched.append(p.id)
        missing = [p for p in rubric if p.id not in matched]
        required_ok = all(p.id in matched for p in rubric if p.required)
        passed = required_ok and len(matched) >= math.ceil(len(rubric) / 2)
        sep = "、" if lang == "zh" else ", "
        if passed:
            fb = t("free_pass", lang, points=sep.join(pick(p.text, lang) for p in rubric if p.id in matched))
            if missing:
                fb += t("free_tip", lang, missing=pick(missing[0].text, lang))
        else:
            key_missing = next((p for p in missing if p.required), missing[0] if missing else rubric[0])
            fb = t("free_almost", lang, missing=pick(key_missing.text, lang))
        return Grade(passed=passed, feedback=fb, matched_points=matched, missing_points=[p.id for p in missing])

    # ---------- translation ----------
    def translate(self, text: str, target_lang: str) -> str:
        if target_lang == "en":
            return text
        needle = text.strip()
        for note in self.roles["send_back_notes"]:
            if note["en"].strip() == needle:
                return note.get(target_lang, text)
        for en, tr in self.mock.get("translations", {}).items():
            if en.strip() == needle:
                return tr.get(target_lang, text)
        return text  # mock cannot translate free text; the UI marks it as untranslated

    # ---------- readiness summary ----------
    def summarize_readiness(self, s: dict) -> str:
        mods = s.get("modules", [])
        done = [m for m in mods if m.get("passed")]
        status = s.get("status")
        if status == "APPLIED":
            return f"Applied via {s.get('source_channel', 'a channel')}. Prefers {s.get('lang_name', 'English')}."
        if status == "SHIFT_READY":
            return f"Stamped ready. Passed all {len(mods)} steps, {s.get('first_try_pct', 0)}% on first try."
        if not done:
            return "Link sent. Hasn't finished a step yet."
        if len(done) < len(mods):
            nxt = next(m for m in mods if not m.get("passed"))
            return f"{len(done)} of {len(mods)} steps done. Working on {nxt['title']} next."
        line = f"Passed all {len(mods)} steps, {s.get('first_try_pct', 0)}% on first try."
        flags = {f["kind"]: f for f in s.get("flags", [])}
        if "buddy" in flags:
            line += " Says they feel unsure: pair with a buddy for the first shift."
        if "double_check" in flags:
            line += f" Felt sure about {flags['double_check']['module']} but missed parts first time: quick check."
        if not flags:
            line += " Feels ready."
        return line

    # ---------- job posts ----------
    def generate_job_posts(self, job: JobInput, channels: list[str] | None = None) -> list[ChannelPost]:
        channels = channels or ALL_CHANNELS
        role = self.roles["roles"].get(job.role, self.roles["roles"]["server"])
        reqs = self.roles["requirements"]
        meta = self.roles["channels"]
        langs = job.languages or ["en"]
        other = [lang for lang in langs if lang != "en"]

        def req_lines(lang: str, bullet: str) -> str:
            return "\n".join(f"{bullet}{pick(reqs[r], lang)}" for r in job.requirements if r in reqs)

        lang_names_en = {"en": "English", "zh": "Mandarin", "es": "Spanish"}
        welcome_en = ", ".join(lang_names_en[x] for x in langs if x in lang_names_en)
        pay = job.pay_range or "Pay discussed at interview"
        sched = job.schedule or "Flexible shifts"
        notes = f"\n{job.notes.strip()}\n" if job.notes.strip() else ""

        texts: dict[str, tuple[str, str]] = {}
        texts["job_board"] = ("en", (
            f"{job.title} · {job.location}\nImperial Treasure Palo Alto · {pay}\n\n"
            f"About the role\n{pick(role['blurb'], 'en')}\n\n"
            f"Schedule\n{sched}\n\n"
            f"What we're looking for\n{req_lines('en', '• ')}\n\n"
            f"Languages\n{welcome_en} speakers welcome. Training is available in your language.\n{notes}\n"
            "How to apply\nReply to this post or ask for the manager in person. No résumé needed."
        ))
        texts["classifieds"] = ("en", (
            f"{job.title.upper()} · {pay} ({job.location})\n\n"
            f"Now hiring: {job.title}. {sched}.\n{req_lines('en', '- ')}\n"
            f"No résumé needed. Training in English, 中文 or Español.\n{notes}"
            "Reply with your name, phone and the days you can work."
        ))
        if "zh" in langs:
            texts["chat_zh"] = ("zh", (
                f"【招聘】{pick(role['title'], 'zh')} 📍{job.location}\n💰 {pay}\n🗓 {sched}\n"
                f"{req_lines('zh', '✅ ')}\n欢迎讲中文、英文、西班牙语的朋友！提供中文培训。\n"
                "有兴趣请回复你的名字和可以上班的时间 🙏"
            ))
        if "es" in langs:
            texts["chat_es"] = ("es", (
                f"*Estamos contratando: {pick(role['title'], 'es')}* 📍{job.location}\n💰 {pay}\n🗓 {sched}\n"
                f"{req_lines('es', '✅ ')}\nCapacitación en español, inglés o chino.\n"
                "Si te interesa, responde con tu nombre y los días que puedes trabajar 🙌"
            ))
        texts["flyer"] = ("en", (
            f"NOW HIRING\n{job.title.upper()}\n{sched} · {pay}\n"
            "No experience? We'll train you, in English, 中文 or Español. Ask any of our team."
        ))
        if other:
            o = other[0]
            label = {"zh": "中文", "es": "Español"}.get(o, o)
            texts["bilingual"] = (f"en+{o}", (
                f"NOW HIRING: {job.title}\n{pick(role['blurb'], 'en')}\n{sched} · {pay}\n{req_lines('en', '• ')}\n\n"
                f"── {label} ──\n"
                + (f"招聘：{pick(role['title'], o)}\n" if o == "zh" else f"SE BUSCA: {pick(role['title'], o)}\n")
                + f"{pick(role['blurb'], o)}\n{sched} · {pay}\n{req_lines(o, '• ')}"
            ))
        simple_reqs = "\n".join(pick(reqs[r], "en") + "." for r in job.requirements if r in reqs)
        texts["easy_read"] = ("en", (
            f"We need a {pick(role['title'], 'en').lower()}.\n{pick(role['easy'], 'en')}\n"
            f"When: {sched}.\nPay: {pay}.\n{simple_reqs}\nWe will train you.\n"
            "You can learn in English, Chinese or Spanish.\nYou do not need a résumé.\n"
            "To apply: talk to us, or reply to this post."
        ))

        posts = []
        for ch in channels:
            if ch not in texts:
                continue
            lang, body = texts[ch]
            m = meta[ch]
            posts.append(ChannelPost(channel=ch, label=m["label"], lang=lang, text=body.strip(),
                                     limit=m["limit"], format_note=m["format_note"]))
        return posts
