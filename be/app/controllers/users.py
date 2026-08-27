"""Stubs para controladores de usuarios. Implementar funciones concretas según endpoints."""
from sqlalchemy.orm import Session


def get_user_by_id(db: Session, user_id):
    """TODO: implementar (delegar a services.users)."""
    raise NotImplementedError("Mover la lógica de users.service aquí y adaptarla")


def list_users(db: Session, *, include_inactive: bool = False):
    raise NotImplementedError
