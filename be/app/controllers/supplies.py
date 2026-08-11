"""Stubs para controladores de insumos (supplies)."""

def deduct_supplies_for_production_controller(db, product_id, amount):
    from app.services.supplies import deduct_supplies_for_production
    return deduct_supplies_for_production(db=db, product_id=product_id, amount=amount)

# Backwards-compatible name
deduct_supplies_for_production = deduct_supplies_for_production_controller
