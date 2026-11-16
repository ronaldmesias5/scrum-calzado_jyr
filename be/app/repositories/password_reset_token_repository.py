# ════════════════════════════════════════
# 📄 Acceso a datos de tokens de recuperación de contraseña
# ════════════════════════════════════════

from sqlalchemy.orm import Session

from app.models.password_reset_token import PasswordResetToken


class PasswordResetTokenRepository:
    """Consultas y mutaciones de PasswordResetToken. No hace commit por diseño."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_token(self, token: str) -> PasswordResetToken | None:
        return self.db.query(PasswordResetToken).filter(PasswordResetToken.token == token).first()

    def add(self, token_record: PasswordResetToken) -> None:
        self.db.add(token_record)
