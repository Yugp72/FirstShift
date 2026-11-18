"""ConvergeProvider: the live AI core. **VERIFY** (see CONVERGE_NOTES.md).

The Converge.AI products (Enter, Framia, Covey, Combos) do not have a documented public HTTP API
that we could confirm at build time. This client speaks a minimal JSON-over-HTTP contract so the
endpoint can be pointed at whatever Enter exposes (a published Enter backend function / webhook).

Contract (POST {CONVERGE_API_URL}):
    request  {"task": "<method>", "prompt": "<text>", "response_format": "json"}
    response {"output": "<json string>"}  or the JSON object itself

All calls go through cached_call() and the live budget. FallbackProvider replays the mock on any
error, so a flaky network never breaks the demo.
"""
from __future__ import annotations

import json
import logging
import os
import urllib.request

from ..i18n import pick
from .base import ChannelPost, Grade, JobInput, RubricPoint
from .cache import cached_call

log = logging.getLogger("firstshift.ai")

LANG_NAMES = {"en": "English", "zh": "Simplified Chinese (Mandarin)", "es": "Spanish"}


class ConvergeProvider:
    name = "converge"

    def __init__(self) -> None:
        self.url = os.environ.get("CONVERGE_API_URL", "")
        self.key = os.environ.get("CONVERGE_API_KEY", "")
        self.timeout = float(os.environ.get("CONVERGE_TIMEOUT", "20"))

    def _complete(self, task: str, prompt: str) -> dict:
        if not self.url:
            raise RuntimeError("CONVERGE_API_URL is not set")

        def call() -> dict:
            body = json.dumps({"task": task, "prompt": prompt, "response_format": "json"}).encode()
            req = urllib.request.Request(self.url, data=body, method="POST",
                                         headers={"Content-Type": "application/json",
                                                  **({"Authorization": f"Bearer {self.key}"} if self.key else {})})
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:  # noqa: S310 (URL from env)
                data = json.loads(resp.read().decode("utf-8"))
            out = data.get("output", data) if isinstance(data, dict) else data
            return json.loads(out) if isinstance(out, str) else out

        return cached_call(self.name, task, {"prompt": prompt}, call)

    def grade_answer(self, question: str, rubric: list[RubricPoint], answer: str, lang: str) -> Grade:
        points = "\n".join(f"- id={p.id} required={p.required}: {pick(p.text, 'en')}" for p in rubric)
        prompt = (
            "You grade a new restaurant hire's short answer. Grade MEANING, not grammar or language. "
            f"The hire may answer in any language.\nQuestion: {question}\nRubric points:\n{points}\n"
            f"Answer: {answer}\n"
            "Pass if every required point is present and at least half of all points are present. "
            f"Write 1-2 warm, encouraging sentences of feedback in {LANG_NAMES.get(lang, 'English')}. "
            "Never use the words wrong, fail, test or quiz. If not passed, name the key missing step kindly.\n"
            'Reply as JSON: {"passed": bool, "feedback": str, "matched_points": [ids], "missing_points": [ids]}'
        )
        return Grade(**self._complete("grade_answer", prompt))

    def translate(self, text: str, target_lang: str) -> str:
        if target_lang == "en":
            return text
        prompt = (
            f"Translate this note from a restaurant manager to a new hire into {LANG_NAMES[target_lang]}. "
            f"Keep it warm and simple.\nNote: {text}\nReply as JSON: {{\"text\": str}}"
        )
        return self._complete("translate", prompt)["text"]

    def summarize_readiness(self, hire_summary: dict) -> str:
        prompt = (
            "Write ONE short line (max 22 words) for a restaurant manager summarising this new hire's "
            f"training readiness. Mention any confidence gap.\nData: {json.dumps(hire_summary, ensure_ascii=False)}\n"
            'Reply as JSON: {"line": str}'
        )
        return self._complete("summarize_readiness", prompt)["line"]

    def generate_job_posts(self, job: JobInput, channels: list[str] | None = None) -> list[ChannelPost]:
        prompt = (
            "Write job posts for Imperial Treasure Palo Alto from ONE job entry. Do not invent pay, policies "
            "or perks beyond the entry.\n"
            f"Entry: {job.model_dump_json()}\nChannels: {channels}\n"
            "Rules: job_board <=5000 chars with headings; classifieds <=1500 chars, pay in title; "
            "chat_zh WeChat-style in Simplified Chinese <=500; chat_es WhatsApp-style in Spanish <=500; "
            "flyer <=300; bilingual English then the first non-English language <=2000; easy_read plain "
            "language, one idea per line <=600.\n"
            'Reply as JSON: {"posts": [{"channel": str, "label": str, "lang": str, "text": str, '
            '"limit": int, "format_note": str}]}'
        )
        return [ChannelPost(**p) for p in self._complete("generate_job_posts", prompt)["posts"]]


class FallbackProvider:
    """Try the live provider; on any error log it and replay the mock so the demo never breaks."""

    def __init__(self, live, fallback) -> None:
        self.live, self.fallback = live, fallback
        self.name = f"{live.name}+fallback"

    def _try(self, method: str, *args, **kwargs):
        try:
            return getattr(self.live, method)(*args, **kwargs)
        except Exception as exc:  # noqa: BLE001
            log.warning("live %s failed (%s); using mock", method, exc)
            return getattr(self.fallback, method)(*args, **kwargs)

    def grade_answer(self, *a, **k):
        return self._try("grade_answer", *a, **k)

    def translate(self, *a, **k):
        return self._try("translate", *a, **k)

    def summarize_readiness(self, *a, **k):
        # Summaries run on every board load; keep them on the mock to protect the live budget.
        return self.fallback.summarize_readiness(*a, **k)

    def generate_job_posts(self, *a, **k):
        return self._try("generate_job_posts", *a, **k)
