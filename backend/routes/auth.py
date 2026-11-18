from __future__ import annotations

import os
import re

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel

from ..auth import check_pw, current_account, end_session, hash_pw, public, start_session
from ..db import execute, now_iso, row

router = APIRouter(prefix="/api/auth", tags=["auth"])
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class SignupIn(BaseModel):
    name: str
    email: str
    password: str
    lang: str = "en"


class LoginIn(BaseModel):
    email: str
    password: str


class DemoIn(BaseModel):
    role: str


@router.get("/me")
async def me(request: Request):
    return {"account": public(current_account(request))}


@router.post("/signup")
async def signup(body: SignupIn, response: Response):
    email = body.email.strip().lower()
    if not EMAIL.match(email):
        raise HTTPException(400, "Enter a valid email address.")
    if len(body.password) < 8:
        raise HTTPException(400, "Use at least 8 characters for your password.")
    if not body.name.strip():
        raise HTTPException(400, "Enter your name.")
    if row("SELECT id FROM account WHERE email=?", email):
        raise HTTPException(409, "An account with this email already exists. Sign in instead.")
    lang = body.lang if body.lang in ("en", "zh", "es") else "en"
    aid = execute("INSERT INTO account(email,name,role,pw_hash,lang,created_at) VALUES (?,?,?,?,?,?)",
                  email, body.name.strip()[:80], "applicant", hash_pw(body.password), lang, now_iso())
    start_session(response, aid)
    return {"account": public(row("SELECT * FROM account WHERE id=?", aid))}


@router.post("/login")
async def login(body: LoginIn, response: Response):
    acct = row("SELECT * FROM account WHERE email=?", body.email.strip().lower())
    if not acct or not check_pw(body.password, acct["pw_hash"]):
        raise HTTPException(401, "That email and password don't match.")
    start_session(response, acct["id"])
    return {"account": public(acct)}


@router.post("/demo")
async def demo(body: DemoIn, response: Response):
    """[DEMO ONLY] One-click sign-in to the seeded demo accounts, so judges never need a password."""
    if os.environ.get("FS_DEMO_LOGIN", "1") == "0":
        raise HTTPException(404, "Demo sign-in is off.")
    email = {"manager": "manager@firstshift.test", "applicant": "lin@firstshift.test"}.get(body.role)
    acct = row("SELECT * FROM account WHERE email=?", email) if email else None
    if not acct:
        raise HTTPException(404, "Demo account not found.")
    start_session(response, acct["id"])
    return {"account": public(acct)}


@router.post("/logout")
async def logout(request: Request, response: Response):
    end_session(request, response)
    return {"ok": True}
