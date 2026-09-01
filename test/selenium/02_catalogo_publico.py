"""
02_catalogo_publico.py — Pruebas del Catálogo Público
======================================================
Caso 1: Verificar que el catálogo carga con productos y filtros
Caso 2: Verificar que el campo de búsqueda funciona correctamente
"""

import time
from selenium.webdriver.common.by import By

from view_test_runner import (
    BASE_URL, _create_driver, _screenshot, _wait_for_element,
)

SCENARIO_PREFIX = "02_catalogo_publico"


def test_02a_catalogo_carga_productos():
    """Verifica que la página de catálogo público carga con productos."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}a — Catálogo carga productos")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/catalog")
        time.sleep(3)

        # --- Locator CSS: verificar URL ---
        assert "/catalog" in driver.current_url, (
            f"No se navegó al catálogo. URL: {driver.current_url}"
        )

        # --- Locator CSS: verificar artículos (productos) ---
        articles = driver.find_elements(By.CSS_SELECTOR, "article")
        assert len(articles) > 0, "No se encontraron productos en el catálogo"

        # --- Locator CSS: verificar filtros (selects) ---
        selects = driver.find_elements(By.CSS_SELECTOR, "select")
        assert len(selects) >= 2, (
            f"Se esperaban al menos 2 filtros, se encontraron {len(selects)}"
        )

        # --- Locator CSS: verificar input de búsqueda ---
        search = driver.find_element(By.CSS_SELECTOR, 'input[type="text"]')
        assert search.is_displayed(), "Campo de búsqueda no visible"

        path = _screenshot(driver, f"{SCENARIO_PREFIX}a_catalogo_carga")
        print(f"  ✅ PASS — Catálogo cargado con {len(articles)} productos")
        print(f"     Filtros: {len(selects)} | Búsqueda: ✅")
        print(f"     Screenshot: {path}")

    except Exception as e:
        _screenshot(driver, f"{SCENARIO_PREFIX}a_FAIL")
        print(f"  ❌ FAIL — {e}")
        raise
    finally:
        driver.quit()


def test_02b_catalogo_filtro_busqueda():
    """Verifica que el campo de búsqueda del catálogo funciona."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}b — Filtro de búsqueda del catálogo")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/catalog")
        time.sleep(3)

        # --- Locator CSS: campo de búsqueda ---
        search_input = driver.find_element(By.CSS_SELECTOR, 'input[type="text"]')
        assert search_input.is_displayed(), "Campo de búsqueda no visible"

        # --- Locator ID: escribir en la búsqueda ---
        search_input.clear()
        search_input.send_keys("zapatilla")
        time.sleep(2)

        valor = search_input.get_attribute("value")
        assert valor == "zapatilla", (
            f"Texto no ingresado. Esperaba 'zapatilla', obtuve '{valor}'"
        )

        # --- Locator XPath: verificar botón "Limpiar" ---
        clear_btn = driver.find_element(
            By.XPATH, '//button[contains(., "Limpiar")]'
        )
        assert clear_btn.is_displayed(), "Botón Limpiar no visible"

        path = _screenshot(driver, f"{SCENARIO_PREFIX}b_filtro_busqueda")
        print(f"  ✅ PASS — Búsqueda funciona correctamente")
        print(f"     Texto ingresado: '{valor}'")
        print(f"     Screenshot: {path}")

    except Exception as e:
        _screenshot(driver, f"{SCENARIO_PREFIX}b_FAIL")
        print(f"  ❌ FAIL — {e}")
        raise
    finally:
        driver.quit()


if __name__ == "__main__":
    print(f"\n{'#'*60}")
    print(f"  SUITE: Catálogo Público")
    print(f"{'#'*60}")
    passed, failed = 0, 0
    for test_fn in [
        test_02a_catalogo_carga_productos,
        test_02b_catalogo_filtro_busqueda,
    ]:
        try:
            test_fn()
            passed += 1
        except Exception:
            failed += 1
    print(f"\n{'='*60}")
    print(f"  RESULTADO: {passed} pasaron, {failed} fallaron")
    print(f"{'='*60}")