# ════════════════════════════════════════
# 📄 Acceso a datos de tokens de verificación de email
# ════════════════════════════════════════

from sqlalchemy.orm import Session

from app.models.email_verification_token import EmailVerificationToken


class EmailVerificationTokenRepository:
    """Consultas y mutaciones de EmailVerificationToken. No hace commit."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_token(self, token: str) -> EmailVerificationToken | None:
        return (
            self.db.query(EmailVerificationToken)
            .filter(EmailVerificationToken.token == token)
            .first()
        )

    def list_unused_by_user(self, user_id) -> list[EmailVerificationToken]:
        return (
            self.db.query(EmailVerificationToken)
            .filter(
                EmailVerificationToken.user_id == user_id,
                EmailVerificationToken.used == False,  # noqa: E712
            )
            .all()
        )

    def add(self, token_record: EmailVerificationToken) -> None:
        self.db.add(token_record)
