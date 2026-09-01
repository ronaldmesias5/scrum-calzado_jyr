"""
08_inventario_admin.py — Pruebas del Inventario Admin
=====================================================
Caso 1: Verificar que la página de inventario carga correctamente
Caso 2: Verificar acceso sin sesión redirige al Landing
"""

import time
from selenium.webdriver.common.by import By

from view_test_runner import (
    BASE_URL, _create_driver, _screenshot, _wait_for_element, _login_as_admin,
)

SCENARIO_PREFIX = "08_inventario_admin"


def test_08a_inventario_admin_carga():
    """Verifica que la página de inventario admin carga correctamente."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}a — Inventario admin carga con sesión")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        _login_as_admin(driver)
        driver.get(f"{BASE_URL}/dashboard/admin/inventory")
        time.sleep(2)

        # --- Locator CSS: verificar URL ---
        assert "/dashboard/admin/inventory" in driver.current_url, (
            f"No se navegó al inventario. URL: {driver.current_url}"
        )

        # --- Locator CSS: sidebar visible ---
        sidebar = _wait_for_element(driver, By.CSS_SELECTOR, "aside nav")
        assert sidebar.is_displayed(), "Sidebar no visible"

        # --- Locator CSS: verificar link activo ---
        inv_link = driver.find_element(
            By.CSS_SELECTOR, 'a[href="/dashboard/admin/inventory"]'
        )
        assert inv_link.is_displayed(), "Link de inventario no visible"

        path = _screenshot(driver, f"{SCENARIO_PREFIX}a_inventario_carga")
        print(f"  ✅ PASS — Inventario admin cargado correctamente")
        print(f"     Screenshot: {path}")

    except Exception as e:
        _screenshot(driver, f"{SCENARIO_PREFIX}a_FAIL")
        print(f"  ❌ FAIL — {e}")
        raise
    finally:
        driver.quit()


def test_08b_inventario_admin_no_autorizado():
    """Verifica que sin sesión, acceder al inventario redirige al Landing."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}b — Inventario admin sin sesión (redirect)")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/dashboard/admin/inventory")
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
    print(f"  SUITE: Inventario Admin")
    print(f"{'#'*60}")
    passed, failed = 0, 0
    for test_fn in [
        test_08a_inventario_admin_carga,
        test_08b_inventario_admin_no_autorizado,
    ]:
        try:
            test_fn()
            passed += 1
        except Exception:
            failed += 1
    print(f"\n{'='*60}")
    print(f"  RESULTADO: {passed} pasaron, {failed} fallaron")
    print(f"{'='*60}")