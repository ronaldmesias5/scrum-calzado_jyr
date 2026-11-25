# ════════════════════════════════════════
# 📄 Acceso a datos de tipos de documento de identidad
# ════════════════════════════════════════

from sqlalchemy.orm import Session

from app.models.type_document import TypeDocument


class DocumentTypeRepository:
    """Consultas y mutaciones de TypeDocument. No hace commit."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def list_all(self) -> list[TypeDocument]:
        return self.db.query(TypeDocument).all()

    def get_by_id(self, type_document_id) -> TypeDocument | None:
        return self.db.query(TypeDocument).filter(TypeDocument.id == type_document_id).first()

    def find_by_name(self, name: str) -> TypeDocument | None:
        return (
            self.db.query(TypeDocument)
            .filter(TypeDocument.name_type_document == name)
            .first()
        )

    def add(self, type_document: TypeDocument) -> None:
        self.db.add(type_document)
