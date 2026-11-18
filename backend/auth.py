"""Accounts and sessions. Two roles: manager (pipeline, posting, approvals) and applicant (apply, train)."""
from __future__ import annotations

import hashlib
import hmac
import secrets

from fastapi import HTTPException, Request, Response

from .db import execute, now_iso, row

COOKIE = "fs_session"
ROLES = {"manager", "applicant"}


def hash_pw(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 200_000).hex()
    return f"pbkdf2${salt}${digest}"


def check_pw(password: str, stored: str | None) -> bool:
    if not stored or stored.count("$") != 2:
        return False
    _, salt, digest = stored.split("$")
    return hmac.compare_digest(hash_pw(password, salt).split("$")[2], digest)


def public(acct: dict | None) -> dict | None:
    if not acct:
        return None
    return {"id": acct["id"], "email": acct["email"], "name": acct["name"], "role": acct["role"], "lang": acct["lang"] or "en"}


def start_session(response: Response, account_id: int) -> None:
    token = secrets.token_urlsafe(32)
    execute("INSERT INTO session(token, account_id, created_at) VALUES (?,?,?)", token, account_id, now_iso())
    response.set_cookie(COOKIE, token, httponly=True, samesite="lax", max_age=60 * 60 * 24 * 14, path="/")


def end_session(request: Request, response: Response) -> None:
    tok = request.cookies.get(COOKIE)
    if tok:
        execute("DELETE FROM session WHERE token=?", tok)
    response.delete_cookie(COOKIE, path="/")


def current_account(request: Request) -> dict | None:
    tok = request.cookies.get(COOKIE)
    if not tok:
        return None
    return row("SELECT a.* FROM session s JOIN account a ON a.id=s.account_id WHERE s.token=?", tok)


async def require_manager(request: Request) -> dict:
    acct = current_account(request)
    if not acct:
        raise HTTPException(401, "Please sign in.")
    if acct["role"] != "manager":
        raise HTTPException(403, "Manager access only.")
    return acct


async def require_account(request: Request) -> dict:
    acct = current_account(request)
    if not acct:
        raise HTTPException(401, "Please sign in.")
    return acct
