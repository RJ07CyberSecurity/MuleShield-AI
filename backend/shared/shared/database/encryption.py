import os
from typing import Any, Optional
from cryptography.fernet import Fernet
from sqlalchemy.types import TypeDecorator, String, Text

class KMSConfig:
    """Mock KMS configuration using environment variables."""
    @staticmethod
    def get_master_key() -> bytes:
        # Provide a default valid Fernet key for local development if not in env
        # A real KMS would use AWS SDK / Vault API here.
        key = os.getenv("MULESHIELD_KMS_MASTER_KEY")
        if not key:
            key = b'zFkQfD06rQ5_N-yXl3x_wP9oU0vFwN4t0Y0f9Qz2R_c='
            os.environ["MULESHIELD_KMS_MASTER_KEY"] = key.decode("utf-8")
        return key.encode('utf-8') if isinstance(key, str) else key

_fernet = Fernet(KMSConfig.get_master_key())

class EncryptedString(TypeDecorator):
    """
    SQLAlchemy custom type for encrypting data at rest.
    Values are encrypted before saving to the DB and decrypted when reading.
    """
    impl = Text
    cache_ok = True

    def process_bind_param(self, value: Optional[str], dialect: Any) -> Optional[str]:
        if value is None:
            return None
        return _fernet.encrypt(value.encode('utf-8')).decode('utf-8')

    def process_result_value(self, value: Optional[str], dialect: Any) -> Optional[str]:
        if value is None:
            return None
        try:
            return _fernet.decrypt(value.encode('utf-8')).decode('utf-8')
        except Exception:
            # Fallback for data inserted before encryption was enabled, or if key rotates
            return value
