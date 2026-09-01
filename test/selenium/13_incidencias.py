"""
13_incidencias.py — Pruebas de Incidencias (Empleado)
=====================================================
Caso 1: Verificar que la página de incidencias carga correctamente
Caso 2: Verificar acceso sin sesión redirige al Landing
"""

import time
from selenium.webdriver.common.by import By

from view_test_runner import (
    BASE_URL, _create_driver, _screenshot, _wait_for_element,
)

SCENARIO_PREFIX = "13_incidencias"


def test_13a_incidencias_requiere_auth():
    """Verifica que la ruta /dashboard/employee/incidences requiere autenticación."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}a — Incidencias requiere autenticación")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/dashboard/employee/incidences")
        time.sleep(3)

        current = driver.current_url
        assert "/dashboard/employee/incidences" not in current, (
            f"Ruta accesible sin auth. URL: {current}"
        )

        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body.strip()) > 0, "Página vacía tras redirect"

        path = _screenshot(driver, f"{SCENARIO_PREFIX}a_requiere_auth")
        print(f"  ✅ PASS — Ruta /dashboard/employee/incidences requiere autenticación")
        print(f"     URL: {current}")
        print(f"     Screenshot: {path}")

    except Exception as e:
        _screenshot(driver, f"{SCENARIO_PREFIX}a_FAIL")
        print(f"  ❌ FAIL — {e}")
        raise
    finally:
        driver.quit()


def test_13b_incidencias_no_autorizado():
    """Verifica que sin sesión, acceder a incidencias redirige al Landing."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}b — Incidencias sin sesión (redirect)")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/dashboard/employee/incidences")
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
    print(f"  SUITE: Incidencias")
    print(f"{'#'*60}")
    passed, failed = 0, 0
    for test_fn in [
        test_13a_incidencias_carga,
        test_13b_incidencias_no_autorizado,
    ]:
        try:
            test_fn()
            passed += 1
        except Exception:
            failed += 1
    print(f"\n{'='*60}")
    print(f"  RESULTADO: {passed} pasaron, {failed} fallaron")
    print(f"{'='*60}")