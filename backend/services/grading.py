"""Multiple choice is graded locally (free, deterministic). Free text goes to AIProvider.grade_answer."""
from __future__ import annotations

from ..ai import get_provider
from ..ai.base import RubricPoint
from ..i18n import pick, t


def grade(question: dict, answer: str, lang: str) -> dict:
    hint = question.get("hint_card")
    if question["type"] == "mc":
        passed = answer == question["answer"]
        return {"passed": passed, "feedback": t("mc_correct" if passed else "almost", lang),
                "hint_card": None if passed else hint, "matched_points": [], "missing_points": []}

    text = (answer or "").strip()
    if len(text) < 2:
        return {"passed": False, "feedback": t("free_empty", lang), "hint_card": None,
                "matched_points": [], "missing_points": []}
    rubric = [RubricPoint(**r) for r in question["rubric"]]
    g = get_provider().grade_answer(pick(question["prompt"], "en"), rubric, text, lang)
    return {"passed": g.passed, "feedback": g.feedback, "hint_card": None if g.passed else hint,
            "matched_points": g.matched_points, "missing_points": g.missing_points}
