"""Hire-facing strings produced by the backend. Never 'wrong', 'fail', 'test' or 'quiz'."""

LANGS = ["en", "zh", "es"]

T: dict[str, dict[str, str]] = {
    "mc_correct": {"en": "That's it.", "zh": "对了！", "es": "¡Eso es!"},
    "almost": {
        "en": "Almost. Here's the bit to look at.",
        "zh": "差一点。我们再看一下这一句。",
        "es": "Casi. Mira esta parte otra vez.",
    },
    "free_pass": {
        "en": "Good answer. You covered: {points}.",
        "zh": "回答得很好。你说到了：{points}。",
        "es": "Buena respuesta. Mencionaste: {points}.",
    },
    "free_tip": {
        "en": " One more thing to remember: {missing}.",
        "zh": "再记住一点：{missing}。",
        "es": " Recuerda también: {missing}.",
    },
    "free_almost": {
        "en": "Almost. You're on the right track. The key step: {missing}.",
        "zh": "差一点，方向是对的。最重要的一步是：{missing}。",
        "es": "Casi, vas por buen camino. El paso clave: {missing}.",
    },
    "free_empty": {
        "en": "Write a few words. Any language is fine.",
        "zh": "写几个字就可以，用什么语言都行。",
        "es": "Escribe unas palabras. Cualquier idioma está bien.",
    },
}


def t(key: str, lang: str, **kw) -> str:
    s = T[key].get(lang) or T[key]["en"]
    return s.format(**kw) if kw else s


def pick(d: dict | str, lang: str) -> str:
    """Pick a language from a {en, zh, es} dict, falling back to English."""
    if isinstance(d, str):
        return d
    return d.get(lang) or d.get("en") or next(iter(d.values()), "")
