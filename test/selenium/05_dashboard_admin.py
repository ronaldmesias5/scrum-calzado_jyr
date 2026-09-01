"""
05_dashboard_admin.py — Pruebas del Dashboard Admin
====================================================
Caso 1: Verificar que el dashboard admin carga con métricas
Caso 2: Verificar acceso sin sesión redirige al Landing
"""

import time
from selenium.webdriver.common.by import By

from view_test_runner import (
    BASE_URL, _create_driver, _screenshot, _wait_for_element, _login_as_admin,
)

SCENARIO_PREFIX = "05_dashboard_admin"


def test_05a_dashboard_admin_carga():
    """Verifica que el dashboard del admin carga correctamente tras login."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}a — Dashboard admin carga con sesión")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        _login_as_admin(driver)
        driver.get(f"{BASE_URL}/dashboard/admin")
        time.sleep(2)

        # --- Locator CSS: verificar URL ---
        assert "/dashboard/admin" in driver.current_url, (
            f"No se navegó al dashboard admin. URL: {driver.current_url}"
        )

        # --- Locator CSS: sidebar visible ---
        sidebar = _wait_for_element(driver, By.CSS_SELECTOR, "aside nav")
        assert sidebar.is_displayed(), "Sidebar no visible"

        # --- Locator CSS: verificar link activo en sidebar ---
        active_link = driver.find_element(
            By.CSS_SELECTOR, 'a[href="/dashboard/admin"]'
        )
        assert active_link.is_displayed(), "Link de Inicio no visible en sidebar"

        path = _screenshot(driver, f"{SCENARIO_PREFIX}a_dashboard_carga")
        print(f"  ✅ PASS — Dashboard admin cargado correctamente")
        print(f"     Sidebar: ✅ | Link activo: ✅")
        print(f"     Screenshot: {path}")

    except Exception as e:
        _screenshot(driver, f"{SCENARIO_PREFIX}a_FAIL")
        print(f"  ❌ FAIL — {e}")
        raise
    finally:
        driver.quit()


def test_05b_dashboard_admin_no_autorizado():
    """Verifica que sin sesión, acceder al dashboard redirige al Landing."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}b — Dashboard admin sin sesión (redirect)")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/dashboard/admin")
        time.sleep(3)

        # --- Locator CSS: verificó que NO está en dashboard ---
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
    print(f"  SUITE: Dashboard Admin")
    print(f"{'#'*60}")
    passed, failed = 0, 0
    for test_fn in [
        test_05a_dashboard_admin_carga,
        test_05b_dashboard_admin_no_autorizado,
    ]:
        try:
            test_fn()
            passed += 1
        except Exception:
            failed += 1
    print(f"\n{'='*60}")
    print(f"  RESULTADO: {passed} pasaron, {failed} fallaron")
    print(f"{'='*60}")