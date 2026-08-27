"""Stubs para controlador de catálogo.

Los endpoints reales del catálogo siguen en `routers/catalog.py`; cuando
se vaya migrando, implementar adaptadores que llamen a servicios apropiados.
"""

def get_categories(db):
    raise NotImplementedError


def get_styles(db):
    raise NotImplementedError


def get_products(db, query_params=None):
    raise NotImplementedError
