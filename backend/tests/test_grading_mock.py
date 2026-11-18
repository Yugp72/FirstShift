import pytest

from backend.ai import cache
from backend.ai.base import RubricPoint
from backend.ai.mock import MockProvider

RUBRIC = [
    RubricPoint(id="allergy.kitchen", required=True, text={"en": "tell the kitchen", "zh": "告诉厨房", "es": "avisar a la cocina"}),
    RubricPoint(id="allergy.write", text={"en": "write it on the order", "zh": "写在点菜单上", "es": "escribirlo en la orden"}),
]


def test_mock_grade_zh_pass_feedback_in_zh():
    g = MockProvider().grade_answer("q", RUBRIC, "我会马上告诉厨房，并写在单子上。", "zh")
    assert g.passed
    assert "告诉厨房" in g.feedback and "回答得很好" in g.feedback


def test_mock_grade_es_almost_is_kind():
    g = MockProvider().grade_answer("q", RUBRIC, "Le digo que lo siento mucho", "es")
    assert not g.passed
    assert g.feedback.startswith("Casi")
    for word in ("incorrect", "wrong", "fail", "mal"):
        assert word not in g.feedback.lower()


def test_mock_grade_accents_and_any_language():
    g = MockProvider().grade_answer("q", RUBRIC, "Aviso a la COCINA y lo escribo", "en")
    assert g.passed and g.feedback.startswith("Good answer")


def test_budget_counter_raises(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_CACHE_DIR", str(tmp_path))
    monkeypatch.setenv("FS_LIVE_BUDGET", "2")
    cache.reset_counter()
    calls = []
    for i in range(2):
        cache.cached_call("t", "m", {"i": i}, lambda i=i: calls.append(i) or {"v": i})
    # cached repeat costs nothing
    assert cache.cached_call("t", "m", {"i": 0}, lambda: {"v": "new"}) == {"v": 0}
    with pytest.raises(cache.BudgetExceeded):
        cache.cached_call("t", "m", {"i": 99}, lambda: {"v": 99})
    assert calls == [0, 1]
    cache.reset_counter()
