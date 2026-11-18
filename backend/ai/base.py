"""The AI provider contract. Routes and services only ever talk to this interface."""
from __future__ import annotations

from typing import Protocol

from pydantic import BaseModel, Field


class RubricPoint(BaseModel):
    id: str
    text: dict[str, str]
    required: bool = False


class Grade(BaseModel):
    passed: bool
    feedback: str
    matched_points: list[str] = Field(default_factory=list)
    missing_points: list[str] = Field(default_factory=list)


class JobInput(BaseModel):
    role: str = "server"
    title: str = "Server"
    location: str = "Palo Alto, CA"
    pay_range: str = ""
    schedule: str = ""
    requirements: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=lambda: ["en", "zh", "es"])
    notes: str = ""


class ChannelPost(BaseModel):
    channel: str
    label: str
    lang: str
    text: str
    limit: int
    format_note: str


ALL_CHANNELS = ["job_board", "classifieds", "chat_zh", "chat_es", "flyer", "bilingual", "easy_read"]


class AIProvider(Protocol):
    name: str

    def generate_job_posts(self, job: JobInput, channels: list[str]) -> list[ChannelPost]: ...

    def grade_answer(self, question: str, rubric: list[RubricPoint], answer: str, lang: str) -> Grade: ...

    def translate(self, text: str, target_lang: str) -> str: ...

    def summarize_readiness(self, hire_summary: dict) -> str: ...
