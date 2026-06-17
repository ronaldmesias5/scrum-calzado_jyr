"""
Módulo de registro de pérdidas por calzado defectuoso (Scrap).

Endpoints:
  GET    /api/v1/admin/scrap/defect-codes       — listar códigos de defecto
  POST   /api/v1/admin/scrap/defect-codes       — crear código de defecto
  GET    /api/v1/admin/scrap/losses             — listar registros de pérdida
  POST   /api/v1/admin/scrap/losses             — registrar pérdida
  GET    /api/v1/admin/scrap/losses/{loss_id}   — detalle de pérdida
  PATCH  /api/v1/admin/scrap/losses/{loss_id}/approve — aprobar pérdida
  PATCH  /api/v1/admin/scrap/losses/{loss_id}/reject  — rechazar pérdida
  GET    /api/v1/admin/scrap/stock              — listar stock de scrap
"""