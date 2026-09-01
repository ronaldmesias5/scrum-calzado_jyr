"""
04_reactivacion.py — Pruebas de Reactivación de Cuenta
======================================================
Caso 1: Verificar que la página de reactivación carga correctamente
Caso 2: Verificar que el formulario tiene email, teléfono y documento
"""

import time
from selenium.webdriver.common.by import By

from view_test_runner import (
    BASE_URL, _create_driver, _screenshot, _wait_for_element,
)

SCENARIO_PREFIX = "04_reactivacion"


def test_04a_reactivacion_pagina_carga():
    """Verifica que la página de reactivación carga correctamente."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}a — Reactivación página carga")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/auth/reactivation")
        time.sleep(2)

        # --- Locator CSS: verificar URL ---
        assert "/auth/reactivation" in driver.current_url, (
            f"No se navegó a reactivation. URL: {driver.current_url}"
        )

        # --- Locator CSS: verificar contenido ---
        body = driver.find_element(By.TAG_NAME, "body").text
        has_content = any(
            kw in body.lower()
            for kw in ["reactivación", "reactivation", "solicitar", "cuenta"]
        )
        assert has_content, "Contenido de reactivación no encontrado"

        path = _screenshot(driver, f"{SCENARIO_PREFIX}a_pagina_carga")
        print(f"  ✅ PASS — Página de reactivación cargada")
        print(f"     Screenshot: {path}")

    except Exception as e:
        _screenshot(driver, f"{SCENARIO_PREFIX}a_FAIL")
        print(f"  ❌ FAIL — {e}")
        raise
    finally:
        driver.quit()


def test_04b_reactivacion_formulario_campos():
    """Verifica que el formulario tiene email, teléfono y documento."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}b — Reactivación formulario campos")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/auth/reactivation")
        time.sleep(2)

        # --- Locator ID: campo email ---
        email_input = _wait_for_element(driver, By.ID, "email")
        assert email_input.is_displayed(), "Campo email no visible"

        # --- Locator ID: campo teléfono ---
        phone_input = driver.find_element(By.ID, "phone")
        assert phone_input.is_displayed(), "Campo teléfono no visible"

        # --- Locator ID: campo documento ---
        doc_input = driver.find_element(By.ID, "identity_document")
        assert doc_input.is_displayed(), "Campo documento no visible"

        # --- Locator XPath: botón de enviar ---
        submit_btn = driver.find_element(By.XPATH, '//button[@type="submit"]')
        assert submit_btn.is_displayed(), "Botón de submit no visible"

        path = _screenshot(driver, f"{SCENARIO_PREFIX}b_formulario_campos")
        print(f"  ✅ PASS — Formulario con todos los campos")
        print(f"     email: ✅ | phone: ✅ | documento: ✅ | submit: ✅")
        print(f"     Screenshot: {path}")

    except Exception as e:
        _screenshot(driver, f"{SCENARIO_PREFIX}b_FAIL")
        print(f"  ❌ FAIL — {e}")
        raise
    finally:
        driver.quit()


if __name__ == "__main__":
    print(f"\n{'#'*60}")
    print(f"  SUITE: Reactivación de Cuenta")
    print(f"{'#'*60}")
    passed, failed = 0, 0
    for test_fn in [
        test_04a_reactivacion_pagina_carga,
        test_04b_reactivacion_formulario_campos,
    ]:
        try:
            test_fn()
            passed += 1
        except Exception:
            failed += 1
    print(f"\n{'='*60}")
    print(f"  RESULTADO: {passed} pasaron, {failed} fallaron")
    print(f"{'='*60}")