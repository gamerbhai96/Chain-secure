"""
Authentication & User Management API routes for BitScan
- JWT-based authentication
- Brevo (Sendinblue) email OTP verification
- SQLite database for users, scan history, OTP storage
"""

import os
import re
import json
import time
import sqlite3
import secrets
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import bcrypt
import jwt
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field, EmailStr

logger = logging.getLogger(__name__)

router = APIRouter()

# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET_KEY", os.getenv("FASTAPI_SECRET_KEY", "fallback-secret-change-me"))
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72
OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", "10"))
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "noreply@chainsecure.app")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "Chain Secure")

# Database path
DB_DIR = Path(__file__).parent.parent.parent / "data"
DB_PATH = DB_DIR / "bitscan.db"


# ──────────────────────────────────────────────
# Database helpers
# ──────────────────────────────────────────────
def _get_db() -> sqlite3.Connection:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = _get_db()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT    NOT NULL,
                email       TEXT    NOT NULL UNIQUE,
                password    TEXT    NOT NULL,
                created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
                updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS otp_verifications (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                email       TEXT    NOT NULL,
                otp_code    TEXT    NOT NULL,
                verified    INTEGER NOT NULL DEFAULT 0,
                expires_at  TEXT    NOT NULL,
                created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS scan_history (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                address     TEXT    NOT NULL,
                risk_score  REAL,
                risk_level  TEXT,
                result_json TEXT,
                scanned_at  TEXT    NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_otp_email   ON otp_verifications(email);
            CREATE INDEX IF NOT EXISTS idx_history_user ON scan_history(user_id);
        """)
        conn.commit()
        logger.info("✅ Auth database initialised at %s", DB_PATH)
    finally:
        conn.close()


# ──────────────────────────────────────────────
# JWT helpers
# ──────────────────────────────────────────────
def create_token(user_id: int, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    payload = verify_token(token)
    conn = _get_db()
    try:
        row = conn.execute("SELECT id, name, email, created_at FROM users WHERE id = ?", (payload["sub"],)).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="User not found")
        return dict(row)
    finally:
        conn.close()


# ──────────────────────────────────────────────
# Brevo OTP email sender
# ──────────────────────────────────────────────
def send_otp_email(email: str, otp_code: str, name: str = "User"):
    """Send OTP verification email via Brevo transactional API."""
    if not BREVO_API_KEY:
        logger.warning("BREVO_API_KEY not set — OTP email skipped (dev mode)")
        print(f"\n\n{'='*40}\nDEV MODE: OTP for {email} is {otp_code}\n{'='*40}\n\n")
        return True  # Allow dev without key

    try:
        import sib_api_v3_sdk
        from sib_api_v3_sdk.rest import ApiException

        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key["api-key"] = BREVO_API_KEY
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": email, "name": name}],
            sender={"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
            subject="Your Chain Secure Verification Code",
            html_content=f"""
            <div style="font-family:'Inter',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d1629;border-radius:16px;border:1px solid rgba(96,165,250,0.2);">
                <div style="text-align:center;margin-bottom:24px;">
                    <h1 style="color:#60a5fa;font-size:24px;margin:0;">Chain Secure</h1>
                    <p style="color:rgba(203,213,225,0.75);font-size:14px;margin-top:4px;">Blockchain Intelligence Platform</p>
                </div>
                <div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:24px;text-align:center;border:1px solid rgba(255,255,255,0.1);">
                    <p style="color:rgba(248,250,252,0.9);font-size:16px;margin:0 0 16px;">Hi {name},</p>
                    <p style="color:rgba(203,213,225,0.75);font-size:14px;margin:0 0 20px;">Your verification code is:</p>
                    <div style="background:linear-gradient(135deg,#2563eb,#06b6d4);border-radius:12px;padding:16px 24px;display:inline-block;">
                        <span style="font-size:32px;font-weight:700;color:#fff;letter-spacing:8px;">{otp_code}</span>
                    </div>
                    <p style="color:rgba(203,213,225,0.5);font-size:13px;margin-top:20px;">This code expires in {OTP_EXPIRY_MINUTES} minutes.</p>
                </div>
                <p style="color:rgba(203,213,225,0.4);font-size:12px;text-align:center;margin-top:20px;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
            """,
        )
        api_instance.send_transac_email(send_smtp_email)
        logger.info("OTP email sent to %s", email)
        return True
    except Exception as e:
        logger.error("Brevo email error: %s", e)
        return False


# ──────────────────────────────────────────────
# Pydantic models
# ──────────────────────────────────────────────
class OtpRequest(BaseModel):
    email: str = Field(..., description="Email to send OTP to")
    name: str = Field(default="User", description="User's name")

class OtpVerifyRequest(BaseModel):
    email: str
    otp_code: str = Field(..., min_length=6, max_length=6)

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., description="Email address")
    password: str = Field(..., min_length=6, max_length=128)

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., description="Email to send password reset OTP to")

class ResetPasswordRequest(BaseModel):
    email: str
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=6, max_length=128)

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None

class ScanHistoryEntry(BaseModel):
    address: str
    risk_score: float
    risk_level: str
    result_json: str  # full JSON blob


# ──────────────────────────────────────────────
# Routes — OTP
# ──────────────────────────────────────────────
@router.post("/send-otp", tags=["Auth"])
async def send_otp(req: OtpRequest):
    """Generate and send a 6-digit OTP to the given email."""
    email = req.email.lower().strip()

    # Basic email format check
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Check if email is already registered
    conn = _get_db()
    try:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered. Please login instead.")

        # Rate-limit: max 5 OTPs per email per hour
        one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        count = conn.execute(
            "SELECT COUNT(*) FROM otp_verifications WHERE email = ? AND created_at > ?",
            (email, one_hour_ago),
        ).fetchone()[0]
        if count >= 5:
            raise HTTPException(status_code=429, detail="Too many OTP requests. Try again later.")

        # Generate OTP
        otp_code = f"{secrets.randbelow(900000) + 100000}"
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)).isoformat()

        conn.execute(
            "INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)",
            (email, otp_code, expires_at),
        )
        conn.commit()
    finally:
        conn.close()

    # Send email via Brevo
    sent = send_otp_email(email, otp_code, req.name)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send OTP email. Please try again.")

    return {"message": "OTP sent successfully", "email": email, "expires_in_minutes": OTP_EXPIRY_MINUTES}


@router.post("/verify-otp", tags=["Auth"])
async def verify_otp(req: OtpVerifyRequest):
    """Verify the OTP code for a given email."""
    email = req.email.lower().strip()
    conn = _get_db()
    try:
        row = conn.execute(
            "SELECT id, otp_code, expires_at, verified FROM otp_verifications "
            "WHERE email = ? ORDER BY created_at DESC LIMIT 1",
            (email,),
        ).fetchone()

        if not row:
            raise HTTPException(status_code=400, detail="No OTP found for this email. Request a new one.")

        if row["verified"]:
            return {"message": "Email already verified", "verified": True}

        now = datetime.now(timezone.utc).isoformat()
        if now > row["expires_at"]:
            raise HTTPException(status_code=400, detail="OTP has expired. Request a new one.")

        if row["otp_code"] != req.otp_code:
            raise HTTPException(status_code=400, detail="Invalid OTP code.")

        conn.execute("UPDATE otp_verifications SET verified = 1 WHERE id = ?", (row["id"],))
        conn.commit()

        return {"message": "Email verified successfully", "verified": True}
    finally:
        conn.close()


# ──────────────────────────────────────────────
# Routes — Register & Login
# ──────────────────────────────────────────────
@router.post("/register", tags=["Auth"])
async def register(req: RegisterRequest):
    """Register a new user. Requires prior OTP verification."""
    email = req.email.lower().strip()

    conn = _get_db()
    try:
        # Check OTP verification
        otp_row = conn.execute(
            "SELECT verified FROM otp_verifications WHERE email = ? AND verified = 1 ORDER BY created_at DESC LIMIT 1",
            (email,),
        ).fetchone()
        if not otp_row:
            raise HTTPException(status_code=400, detail="Email not verified. Please verify your email first.")

        # Check duplicate
        if conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
            raise HTTPException(status_code=409, detail="Email already registered.")

        # Hash password
        hashed = bcrypt.hashpw(req.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        cur = conn.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            (req.name.strip(), email, hashed),
        )
        conn.commit()
        user_id = cur.lastrowid

        # Clean up OTP records for this email
        conn.execute("DELETE FROM otp_verifications WHERE email = ?", (email,))
        conn.commit()

        token = create_token(user_id, email)
        return {
            "message": "Registration successful",
            "token": token,
            "user": {"id": user_id, "name": req.name.strip(), "email": email},
        }
    finally:
        conn.close()


@router.post("/login", tags=["Auth"])
async def login(req: LoginRequest):
    """Login with email and password."""
    email = req.email.lower().strip()

    conn = _get_db()
    try:
        row = conn.execute("SELECT id, name, email, password FROM users WHERE email = ?", (email,)).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        if not bcrypt.checkpw(req.password.encode("utf-8"), row["password"].encode("utf-8")):
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        token = create_token(row["id"], row["email"])
        return {
            "message": "Login successful",
            "token": token,
            "user": {"id": row["id"], "name": row["name"], "email": row["email"]},
        }
    finally:
        conn.close()


@router.post("/forgot-password", tags=["Auth"])
async def forgot_password(req: ForgotPasswordRequest):
    """Generate and send a password reset OTP to an existing user."""
    email = req.email.lower().strip()
    
    conn = _get_db()
    try:
        user = conn.execute("SELECT name FROM users WHERE email = ?", (email,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Email not found.")
        
        # Rate-limit
        one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        count = conn.execute(
            "SELECT COUNT(*) FROM otp_verifications WHERE email = ? AND created_at > ?",
            (email, one_hour_ago),
        ).fetchone()[0]
        if count >= 5:
            raise HTTPException(status_code=429, detail="Too many requests. Try again later.")
            
        otp_code = f"{secrets.randbelow(900000) + 100000}"
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)).isoformat()
        
        # Clear existing unverified OTPs for this email to avoid clutter
        conn.execute("DELETE FROM otp_verifications WHERE email = ?", (email,))
        
        conn.execute(
            "INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)",
            (email, otp_code, expires_at),
        )
        conn.commit()
    finally:
        conn.close()
        
    sent = send_otp_email(email, otp_code, user["name"])
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send email. Please try again.")
        
    return {"message": "Password reset OTP sent", "email": email}


@router.post("/reset-password", tags=["Auth"])
async def reset_password(req: ResetPasswordRequest):
    """Reset password using verified OTP."""
    email = req.email.lower().strip()
    
    conn = _get_db()
    try:
        user = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
            
        otp_row = conn.execute(
            "SELECT id, otp_code, expires_at, verified FROM otp_verifications "
            "WHERE email = ? ORDER BY created_at DESC LIMIT 1",
            (email,)
        ).fetchone()
        
        if not otp_row:
            raise HTTPException(status_code=400, detail="No reset request found.")
            
        now = datetime.now(timezone.utc).isoformat()
        if now > otp_row["expires_at"]:
            raise HTTPException(status_code=400, detail="OTP has expired.")
            
        if otp_row["otp_code"] != req.otp_code:
            raise HTTPException(status_code=400, detail="Invalid OTP code.")
            
        # Proceed with password reset
        hashed = bcrypt.hashpw(req.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        conn.execute("UPDATE users SET password = ?, updated_at = datetime('now') WHERE email = ?", (hashed, email))
        conn.execute("DELETE FROM otp_verifications WHERE email = ?", (email,))
        conn.commit()
        
        return {"message": "Password has been reset successfully"}
    finally:
        conn.close()


# ──────────────────────────────────────────────
# Routes — Profile
# ──────────────────────────────────────────────
@router.get("/me", tags=["Auth"])
async def get_profile(user: dict = Depends(get_current_user)):
    """Get current user profile."""
    return {"user": user}


@router.put("/me", tags=["Auth"])
async def update_profile(req: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    """Update current user profile."""
    conn = _get_db()
    try:
        updates = []
        params = []
        if req.name is not None:
            updates.append("name = ?")
            params.append(req.name.strip())
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        updates.append("updated_at = datetime('now')")
        params.append(user["id"])

        conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

        row = conn.execute("SELECT id, name, email, created_at FROM users WHERE id = ?", (user["id"],)).fetchone()
        return {"user": dict(row)}
    finally:
        conn.close()


# ──────────────────────────────────────────────
# Routes — Scan History
# ──────────────────────────────────────────────
@router.get("/history", tags=["Auth"])
async def get_scan_history(user: dict = Depends(get_current_user)):
    """Get the authenticated user's scan history."""
    conn = _get_db()
    try:
        rows = conn.execute(
            "SELECT id, address, risk_score, risk_level, result_json, scanned_at "
            "FROM scan_history WHERE user_id = ? ORDER BY scanned_at DESC LIMIT 50",
            (user["id"],),
        ).fetchall()
        history = []
        for r in rows:
            entry = dict(r)
            try:
                entry["result"] = json.loads(entry.pop("result_json"))
            except (json.JSONDecodeError, KeyError):
                entry["result"] = None
            history.append(entry)
        return {"history": history}
    finally:
        conn.close()


@router.post("/history", tags=["Auth"])
async def save_scan_history(entry: ScanHistoryEntry, user: dict = Depends(get_current_user)):
    """Save a scan result to the user's history."""
    conn = _get_db()
    try:
        conn.execute(
            "INSERT INTO scan_history (user_id, address, risk_score, risk_level, result_json) VALUES (?, ?, ?, ?, ?)",
            (user["id"], entry.address, entry.risk_score, entry.risk_level, entry.result_json),
        )
        conn.commit()
        return {"message": "Scan saved to history"}
    finally:
        conn.close()


@router.delete("/history", tags=["Auth"])
async def clear_scan_history(user: dict = Depends(get_current_user)):
    """Clear the authenticated user's scan history."""
    conn = _get_db()
    try:
        conn.execute("DELETE FROM scan_history WHERE user_id = ?", (user["id"],))
        conn.commit()
        return {"message": "Scan history cleared"}
    finally:
        conn.close()
