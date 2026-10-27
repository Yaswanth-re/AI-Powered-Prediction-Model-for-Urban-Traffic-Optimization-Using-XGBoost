import hashlib
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Union

from jose import jwt

from app.core.config import settings


def _legacy_hash(password: str) -> str:
    return hashlib.sha256(f"{settings.SECRET_KEY}:{password}".encode("utf-8")).hexdigest()


def get_password_hash(password: str) -> str:
    """Hash a password with PBKDF2-HMAC-SHA256 and a random salt."""
    salt = os.urandom(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
    return salt.hex() + ":" + derived.hex()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a PBKDF2 hash, with a legacy compatibility fallback."""
    if not hashed_password:
        return False

    if ":" in hashed_password:
        salt_hex, digest_hex = hashed_password.split(":", 1)
        try:
            salt = bytes.fromhex(salt_hex)
            derived = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 200_000)
            return derived.hex() == digest_hex
        except ValueError:
            pass

    return _legacy_hash(plain_password) == hashed_password


def create_access_token(subject: Union[str, Any], role: str, expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"sub": str(subject), "role": role, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
