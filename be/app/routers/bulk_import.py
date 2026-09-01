"""
Router FastAPI para importación masiva de datos (CSV).
"""

import csv
import io
import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.dependencies import _require_admin_or_jefe, get_current_user, get_db
from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product
from app.models.role import Role
from app.models.style import Style
from app.models.user import User
from app.utils.security import hash_password

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/admin/bulk", tags=["Importación Masiva"])


@router.post(
    "/import-users",
    response_model=dict,
    summary="Importar usuarios desde CSV",
)
def import_users_from_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Importa múltiples usuarios desde un archivo CSV.

    Columnas requeridas: email, name_user, last_name, role_name
    Columnas opcionales: phone, identity_document, occupation, business_name

    El sistema genera contraseñas temporales que el admin/jefe comparte con
    cada usuario (deberán cambiarla en el primer login).
    """
    _require_admin_or_jefe(current_user)

    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser un CSV (.csv)"
        )

    content = file.file.read().decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(content))

    # Validate required columns
    required_columns = {'email', 'name_user', 'last_name', 'role_name'}
    if not required_columns.issubset(set(reader.fieldnames or [])):
        missing = required_columns - set(reader.fieldnames or [])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Columnas faltantes en el CSV: {', '.join(missing)}"
        )

    results = {"created": 0, "skipped": 0, "errors": []}

    for i, row in enumerate(reader, start=2):
        try:
            email = row['email'].strip().lower()

            # Check if user already exists
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                results["skipped"] += 1
                results["errors"].append(f"Fila {i}: Email ya existe ({email})")
                continue

            # Find role
            role = db.query(Role).filter(Role.name_role == row['role_name'].strip()).first()
            if not role:
                results["skipped"] += 1
                results["errors"].append(f"Fila {i}: Rol no encontrado ({row['role_name']})")
                continue

            # Generate temporary password
            temp_password = secrets.token_urlsafe(12)

            new_user = User(
                email=email,
                name_user=row['name_user'].strip(),
                last_name=row['last_name'].strip(),
                phone=row.get('phone', '').strip() or None,
                identity_document=row.get('identity_document', '').strip() or None,
                occupation=row.get('occupation', '').strip() or None,
                business_name=row.get('business_name', '').strip() or None,
                hashed_password=hash_password(temp_password),
                role_id=role.id,
                is_active=True,
                is_validated=True,
                must_change_password=True,
                invitation_expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
                created_by=current_user.id,
            )

            db.add(new_user)
            results["created"] += 1

        except Exception as e:
            results["skipped"] += 1
            results["errors"].append(f"Fila {i}: {str(e)}")

    db.commit()

    logger.info(
        f"Importación masiva de usuarios por {_get_email(current_user)}: "
        f"{results['created']} creados, {results['skipped']} omitidos"
    )

    return results


@router.post(
    "/import-products",
    response_model=dict,
    summary="Importar productos desde CSV",
)
def import_products_from_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Importa múltiples productos desde un archivo CSV.

    Columnas requeridas: name_product, brand_name, category_name, style_name
    Columnas opcionales: description, image_url

    Si la marca, categoría o estilo no existen, se crean automáticamente.
    """
    _require_admin_or_jefe(current_user)

    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser un CSV (.csv)"
        )

    content = file.file.read().decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(content))

    required_columns = {'name_product', 'brand_name', 'category_name', 'style_name'}
    if not required_columns.issubset(set(reader.fieldnames or [])):
        missing = required_columns - set(reader.fieldnames or [])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Columnas faltantes en el CSV: {', '.join(missing)}"
        )

    results = {"created": 0, "skipped": 0, "errors": []}

    for i, row in enumerate(reader, start=2):
        try:
            name = row['name_product'].strip()

            # Check if product exists
            existing = db.query(Product).filter(Product.name_product == name).first()
            if existing:
                results["skipped"] += 1
                results["errors"].append(f"Fila {i}: Producto ya existe ({name})")
                continue

            # Find or create brand
            brand = db.query(Brand).filter(Brand.name_brand == row['brand_name'].strip()).first()
            if not brand:
                brand = Brand(name_brand=row['brand_name'].strip())
                db.add(brand)
                db.flush()

            # Find or create category
            category = (
                db.query(Category)
                .filter(Category.name_category == row['category_name'].strip())
                .first()
            )
            if not category:
                category = Category(name_category=row['category_name'].strip())
                db.add(category)
                db.flush()

            # Find or create style (vinculado a la marca de la fila)
            style = db.query(Style).filter(Style.name_style == row['style_name'].strip()).first()
            if not style:
                style = Style(name_style=row['style_name'].strip(), brand_id=brand.id)
                db.add(style)
                db.flush()

            new_product = Product(
                name_product=name,
                description_product=row.get('description', '').strip() or None,
                image_url=row.get('image_url', '').strip() or None,
                brand_id=brand.id,
                category_id=category.id,
                style_id=style.id,
            )

            db.add(new_product)
            results["created"] += 1

        except Exception as e:
            results["skipped"] += 1
            results["errors"].append(f"Fila {i}: {str(e)}")

    db.commit()

    logger.info(
        f"Importación masiva de productos por {_get_email(current_user)}: "
        f"{results['created']} creados, {results['skipped']} omitidos"
    )

    return results


def _get_email(user: User) -> str:
    """Helper to get user email for logging."""
    return user.email if hasattr(user, 'email') else str(user.id)