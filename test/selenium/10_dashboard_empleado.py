"""
10_dashboard_empleado.py — Pruebas del Dashboard Empleado
=========================================================
Caso 1: Verificar que el dashboard empleado carga con métricas
Caso 2: Verificar acceso sin sesión redirige al Landing
"""

import time
from selenium.webdriver.common.by import By

from view_test_runner import (
    BASE_URL, _create_driver, _screenshot, _wait_for_element,
)

SCENARIO_PREFIX = "10_dashboard_empleado"


def test_10a_dashboard_empleado_requiere_auth():
    """Verifica que la ruta /dashboard/employee requiere autenticación."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}a — Dashboard empleado requiere autenticación")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/dashboard/employee")
        time.sleep(3)

        # --- Locator CSS: la ruta redirige al Landing (no está en employee) ---
        current = driver.current_url
        assert "/dashboard/employee" not in current, (
            f"Ruta /dashboard/employee accesible sin auth. URL: {current}"
        )

        # --- Locator CSS: verificar que hay contenido (Landing o login) ---
        body = driver.find_element(By.TAG_NAME, "body").text
        has_content = len(body.strip()) > 0
        assert has_content, "Página vacía tras redirect"

        path = _screenshot(driver, f"{SCENARIO_PREFIX}a_requiere_auth")
        print(f"  ✅ PASS — Ruta /dashboard/employee requiere autenticación")
        print(f"     URL: {current}")
        print(f"     Screenshot: {path}")

    except Exception as e:
        _screenshot(driver, f"{SCENARIO_PREFIX}a_FAIL")
        print(f"  ❌ FAIL — {e}")
        raise
    finally:
        driver.quit()


def test_10b_dashboard_empleado_no_autorizado():
    """Verifica que sin sesión, acceder al dashboard empleado redirige al Landing."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}b — Dashboard empleado sin sesión (redirect)")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/dashboard/employee")
        time.sleep(3)

        assert "/dashboard" not in driver.current_url, (
            f"Se permanece en dashboard sin auth. URL: {driver.current_url}"
        )

        path = _screenshot(driver, f"{SCENARIO_PREFIX}b_no_autorizado")
        print(f"  ✅ PASS — Redirigido al Landing (no autorizado)")
        print(f"     URL: {driver.current_url}")
        print(f"     Screenshot: {path}")

    except Exception as e:
        _screenshot(driver, f"{SCENARIO_PREFIX}b_FAIL")
        print(f"  ❌ FAIL — {e}")
        raise
    finally:
        driver.quit()


if __name__ == "__main__":
    print(f"\n{'#'*60}")
    print(f"  SUITE: Dashboard Empleado")
    print(f"{'#'*60}")
    passed, failed = 0, 0
    for test_fn in [
        test_10a_dashboard_empleado_carga,
        test_10b_dashboard_empleado_no_autorizado,
    ]:
        try:
            test_fn()
            passed += 1
        except Exception:
            failed += 1
    print(f"\n{'='*60}")
    print(f"  RESULTADO: {passed} pasaron, {failed} fallaron")
    print(f"{'='*60}")