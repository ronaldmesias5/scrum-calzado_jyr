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

    rows = list(reader)
    # Lotes previos al loop (evita N+1: 2 queries por fila)
    roles_by_name = {r.name_role: r for r in db.query(Role).all()}
    csv_emails = {row['email'].strip().lower() for row in rows}
    existing_emails: set[str] = set()
    if csv_emails:
        existing_emails = {
            r[0]
            for r in db.query(User.email).filter(User.email.in_(csv_emails)).all()
        }

    for i, row in enumerate(rows, start=2):
        try:
            email = row['email'].strip().lower()

            # Check if user already exists
            if email in existing_emails:
                results["skipped"] += 1
                results["errors"].append(f"Fila {i}: Email ya existe ({email})")
                continue

            # Find role
            role = roles_by_name.get(row['role_name'].strip())
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
            # Commit por fila: un IntegrityError sin rollback deja la sesión en
            # pending rollback y haría fallar todas las filas siguientes.
            db.commit()
            existing_emails.add(email)
            results["created"] += 1

        except Exception as e:
            db.rollback()
            results["skipped"] += 1
            results["errors"].append(f"Fila {i}: {str(e)}")

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

    rows = list(reader)
    # Catálogo y existentes en lote (evita N+1: 4 queries por fila)
    csv_names = {row['name_product'].strip() for row in rows}
    existing_names: set[str] = set()
    if csv_names:
        existing_names = {
            r[0]
            for r in db.query(Product.name_product)
            .filter(Product.name_product.in_(csv_names))
            .all()
        }
    brands_by_name = {b.name_brand: b for b in db.query(Brand).all()}
    categories_by_name = {c.name_category: c for c in db.query(Category).all()}
    styles_by_name = {s.name_style: s for s in db.query(Style).all()}

    for i, row in enumerate(rows, start=2):
        name = row['name_product'].strip()
        try:
            # Check if product exists
            if name in existing_names:
                results["skipped"] += 1
                results["errors"].append(f"Fila {i}: Producto ya existe ({name})")
                continue

            # Find or create brand
            brand_name = row['brand_name'].strip()
            brand = brands_by_name.get(brand_name)
            if not brand:
                brand = Brand(name_brand=brand_name)
                db.add(brand)
                db.flush()
                brands_by_name[brand_name] = brand

            # Find or create category
            category_name = row['category_name'].strip()
            category = categories_by_name.get(category_name)
            if not category:
                category = Category(name_category=category_name)
                db.add(category)
                db.flush()
                categories_by_name[category_name] = category

            # Find or create style (vinculado a la marca de la fila)
            style_name = row['style_name'].strip()
            style = styles_by_name.get(style_name)
            if not style:
                style = Style(name_style=style_name, brand_id=brand.id)
                db.add(style)
                db.flush()
                styles_by_name[style_name] = style

            new_product = Product(
                name_product=name,
                description_product=row.get('description', '').strip() or None,
                image_url=row.get('image_url', '').strip() or None,
                brand_id=brand.id,
                category_id=category.id,
                style_id=style.id,
            )

            db.add(new_product)
            # Commit por fila: un IntegrityError sin rollback deja la sesión en
            # pending rollback y haría fallar todas las filas siguientes.
            db.commit()
            existing_names.add(name)
            results["created"] += 1

        except Exception as e:
            db.rollback()
            # El rollback invalida objetos creados con flush: recargar cachés
            brands_by_name = {b.name_brand: b for b in db.query(Brand).all()}
            categories_by_name = {c.name_category: c for c in db.query(Category).all()}
            styles_by_name = {s.name_style: s for s in db.query(Style).all()}
            if name in existing_names:
                existing_names.discard(name)
            results["skipped"] += 1
            results["errors"].append(f"Fila {i}: {str(e)}")

    logger.info(
        f"Importación masiva de productos por {_get_email(current_user)}: "
        f"{results['created']} creados, {results['skipped']} omitidos"
    )

    return results


def _get_email(user: User) -> str:
    """Helper to get user email for logging."""
    return user.email if hasattr(user, 'email') else str(user.id)