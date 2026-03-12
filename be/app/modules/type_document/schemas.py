"""
Archivo: be/app/modules/type_document/schemas.py
Descripción: Schemas Pydantic para tipos de documentos de identidad.

¿Qué?
  Define 2 schemas simples:
  - TypeDocumentCreate: name (str) para crear nuevo tipo
  - TypeDocumentResponse: id (UUID) + name para respuestas
  
¿Para qué?
  - Validar entrada en POST /type-documents (futuro endpoint)
  - Serializar respuestas de GET /type-documents
  - Type safety entre BD y API (Pydantic from_attributes=True)
  
¿Impacto?
  BAJO — Modificar estos schemas solo afecta type_document/router.py.
  Frontend depende de TypeDocumentResponse.
  Dependencias: type_document/router.py, models/type_document.py
"""

import uuid

from pydantic import BaseModel


class TypeDocumentCreate(BaseModel):
    name: str


class TypeDocumentResponse(BaseModel):
    id: uuid.UUID
    name: str

    model_config = {"from_attributes": True}
