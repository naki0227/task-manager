"""
Encryption Service
Handles AES-256 encryption for sensitive tokens using Fernet.
"""

from cryptography.fernet import Fernet
from app.config import get_settings
import os

_fernet = None

def get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            raise ValueError("ENCRYPTION_KEY is not set in environment variables.")
        _fernet = Fernet(key)
    return _fernet

def encrypt_token(token: str) -> str:
    """Encrypt a plain text token."""
    if not token:
        return ""
    f = get_fernet()
    # Fernet encrypts bytes -> bytes on Python 3
    encrypted_bytes = f.encrypt(token.encode("utf-8"))
    return encrypted_bytes.decode("utf-8")

def decrypt_token(encrypted_token: str) -> str:
    """Decrypt an encrypted token."""
    if not encrypted_token:
        return ""
    f = get_fernet()
    decrypted_bytes = f.decrypt(encrypted_token.encode("utf-8"))
    return decrypted_bytes.decode("utf-8")
