# ════════════════════════════════════════
# 📄 Schemas Pydantic para tipos de documentos de identidad
# ════════════════════════════════════════

import uuid

from pydantic import BaseModel


class TypeDocumentCreate(BaseModel):
    name: str


class TypeDocumentResponse(BaseModel):
    id: uuid.UUID
    name: str

    model_config = {"from_attributes": True}
