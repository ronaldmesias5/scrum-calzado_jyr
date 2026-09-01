"""
run_all.py — Ejecutor maestro de la suite completa de Selenium
==============================================================
Ejecuta los 15 scripts de prueba (30+ casos de uso) contra el frontend de CALZADO J&R.

Uso:
    python run_all.py                    # ejecuta todo
    python run_all.py --headless         # sin ventana del navegador
    python run_all.py --base-url http://...  # URL personalizada

Requisitos:
    - Frontend corriendo en http://localhost:5173 (o la URL configurada)
    - Backend corriendo en http://localhost:8000 (para autenticación)
    - Google Chrome instalado
    - pip install selenium webdriver-manager

Autor: QA Automation — Proyecto CALZADO J&R (ADSO 228118)
"""

import os
import sys
import time
import importlib
import traceback
from pathlib import Path

# Configurar entorno antes de importar módulos
if "--headless" in sys.argv:
    os.environ["SELENIUM_HEADLESS"] = "true"

if "--base-url" in sys.argv:
    idx = sys.argv.index("--base-url")
    if idx + 1 < len(sys.argv):
        os.environ["SELENIUM_BASE_URL"] = sys.argv[idx + 1]

# Añadir directorio actual al path para imports
sys.path.insert(0, str(Path(__file__).parent))

# Lista de módulos a ejecutar en orden
MODULES = [
    ("01_landing_login", "Landing Page & Login"),
    ("02_catalogo_publico", "Catálogo Público"),
    ("03_restaurar_contrasena", "Restablecer Contraseña"),
    ("04_reactivacion", "Reactivación de Cuenta"),
    ("05_dashboard_admin", "Dashboard Admin"),
    ("06_pedidos_admin", "Pedidos Admin"),
    ("07_catalogo_admin", "Catálogo Admin"),
    ("08_inventario_admin", "Inventario Admin"),
    ("09_clientes_admin", "Clientes Admin"),
    ("10_dashboard_empleado", "Dashboard Empleado"),
    ("11_mis_tareas", "Mis Tareas"),
    ("12_tareas_disponibles", "Tareas Disponibles"),
    ("13_incidencias", "Incidencias"),
    ("14_dashboard_cliente", "Dashboard Cliente"),
    ("15_pedidos_cliente", "Pedidos Cliente"),
]


def run_all():
    """Ejecuta todos los módulos de prueba y genera reporte final."""
    from view_test_runner import BASE_URL, HEADLESS, SCREENSHOT_DIR

    print()
    print("=" * 70)
    print("  SUITE DE AUTOMATIZACIÓN SELENIUM — CALZADO J&R")
    print("=" * 70)
    print(f"  Base URL:      {BASE_URL}")
    print(f"  Headless:      {HEADLESS}")
    print(f"  Screenshots:   {SCREENSHOT_DIR}")
    print(f"  Módulos:       {len(MODULES)}")
    print(f"  Tests/módulo:  2-3 (mínimo 2 por vista)")
    print(f"  Total tests:   ~{len(MODULES) * 2}+")
    print("=" * 70)

    total_passed = 0
    total_failed = 0
    total_errors = 0
    results = []

    for module_name, module_desc in MODULES:
        print(f"\n{'─'*70}")
        print(f"  📁 Módulo: {module_desc} ({module_name})")
        print(f"{'─'*70}")

        try:
            mod = importlib.import_module(module_name)

            # Encontrar todas las funciones test_* del módulo
            test_fns = [
                getattr(mod, name)
                for name in dir(mod)
                if name.startswith("test_") and callable(getattr(mod, name))
            ]

            module_passed = 0
            module_failed = 0

            for test_fn in test_fns:
                try:
                    test_fn()
                    module_passed += 1
                    total_passed += 1
                except Exception:
                    module_failed += 1
                    total_failed += 1
                    traceback.print_exc()

            status = "✅" if module_failed == 0 else "❌"
            results.append((module_name, module_desc, module_passed, module_failed, status))
            total_passed_count = module_passed
            total_failed_count = module_failed

        except ImportError as e:
            print(f"  💥 ERROR de importación: {e}")
            results.append((module_name, module_desc, 0, 0, "💥"))
            total_errors += 1
        except Exception as e:
            print(f"  💥 ERROR inesperado: {e}")
            results.append((module_name, module_desc, 0, 0, "💥"))
            total_errors += 1

    # --- REPORTE FINAL ---
    print()
    print("=" * 70)
    print("  REPORTE FINAL")
    print("=" * 70)
    print(f"  {'Módulo':<35} {'Pass':>5} {'Fail':>5} {'Estado':>8}")
    print(f"  {'─'*35} {'─'*5} {'─'*5} {'─'*8}")

    for name, desc, p, f, status in results:
        print(f"  {desc:<35} {p:>5} {f:>5} {status:>8}")

    print(f"  {'─'*35} {'─'*5} {'─'*5} {'─'*8}")
    print(f"  {'TOTALES':<35} {total_passed:>5} {total_failed:>5}")
    print()
    print(f"  📊 Total tests:  {total_passed + total_failed}")
    print(f"  ✅ Pasaron:      {total_passed}")
    print(f"  ❌ Fallaron:     {total_failed}")
    print(f"  💥 Errores:      {total_errors}")
    print(f"  📸 Screenshots:  {SCREENSHOT_DIR}")
    print("=" * 70)

    if total_failed == 0 and total_errors == 0:
        print("\n  🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!\n")
    else:
        print(f"\n  ⚠️  Hay {total_failed + total_errors} pruebas que requieren atención.\n")

    return total_failed == 0 and total_errors == 0


if __name__ == "__main__":
    success = run_all()
    sys.exit(0 if success else 1)
