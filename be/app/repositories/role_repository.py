# ════════════════════════════════════════
# 📄 Acceso a datos de roles de usuario
# ════════════════════════════════════════

from sqlalchemy.orm import Session

from app.models.role import Role


class RoleRepository:
    """Consultas de Role. No hace commit: la transacción la dirige la capa superior."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_name(self, name_role: str) -> Role | None:
        return self.db.query(Role).filter(Role.name_role == name_role).first()

    def list_all(self) -> list[Role]:
        return self.db.query(Role).all()
