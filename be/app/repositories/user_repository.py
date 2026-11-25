# ════════════════════════════════════════
# 📄 Acceso a datos de usuarios (roles: cliente, empleado, jefe)
# ════════════════════════════════════════

from sqlalchemy import String, cast
from sqlalchemy.orm import Session

from app.models.role import Role
from app.models.user import User
from app.utils.normalization import normalize_email


class UserRepository:
    """Consultas y mutaciones de User. No hace commit: la transacción la dirige la capa superior."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == normalize_email(email)).first()

    def get_by_id(self, user_id) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def list_pending_validation(self, offset: int = 0, limit: int = 100) -> list[User]:
        return (
            self.db.query(User)
            .filter(User.is_validated == False, User.rejection_reason == None)  # noqa: E712
            .order_by(User.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def list_active(
        self, role_name: str | None = None, offset: int = 0, limit: int = 100
    ) -> list[User]:
        query = self.db.query(User).filter(User.deleted_at == None)  # noqa: E711
        if role_name:
            query = query.join(Role, User.role_id == Role.id).filter(Role.name_role == role_name)
        return query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()

    def list_by_occupation(self, role_name: str) -> list[User]:
        """Usuarios cuyo cargo (occupation) coincide, comparando con cast a texto."""
        return (
            self.db.query(User)
            .filter(cast(User.occupation, String) == role_name.lower())
            .all()
        )

    def existing_emails(self, emails: set[str]) -> set[str]:
        """Emails ya registrados dentro del conjunto dado."""
        if not emails:
            return set()
        return {row[0] for row in self.db.query(User.email).filter(User.email.in_(emails)).all()}

    def add(self, user: User) -> None:
        self.db.add(user)

    def delete(self, user: User) -> None:
        self.db.delete(user)
