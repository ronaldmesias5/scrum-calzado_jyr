"""
03_restaurar_contrasena.py — Pruebas de Restablecer Contraseña
==============================================================
Caso 1: Verificar que la página de reset password carga correctamente
Caso 2: Verificar que el formulario tiene los campos esperados
"""

import time
from selenium.webdriver.common.by import By

from view_test_runner import (
    BASE_URL, _create_driver, _screenshot, _wait_for_element,
)

SCENARIO_PREFIX = "03_restaurar_contrasena"


def test_03a_reset_password_pagina_carga():
    """Verifica que la página de restablecer contraseña carga correctamente."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}a — Reset Password página carga")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/auth/reset-password?token=qa-test-token")
        time.sleep(2)

        # --- Locator CSS: verificar URL ---
        assert "/auth/reset-password" in driver.current_url, (
            f"No se navegó a reset-password. URL: {driver.current_url}"
        )

        # --- Locator CSS: verificar contenido ---
        body = driver.find_element(By.TAG_NAME, "body").text
        has_title = any(
            kw in body.lower()
            for kw in ["restablecer", "contraseña", "password", "nueva"]
        )
        assert has_title, "Título de reset password no encontrado"

        path = _screenshot(driver, f"{SCENARIO_PREFIX}a_pagina_carga")
        print(f"  ✅ PASS — Página de reset password cargada")
        print(f"     Screenshot: {path}")

    except Exception as e:
        _screenshot(driver, f"{SCENARIO_PREFIX}a_FAIL")
        print(f"  ❌ FAIL — {e}")
        raise
    finally:
        driver.quit()


def test_03b_reset_password_formulario_campos():
    """Verifica que el formulario tiene campos de contraseña y botón submit."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}b — Reset Password formulario campos")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/auth/reset-password?token=qa-test-token")
        time.sleep(2)

        # --- Locator ID: campo nueva contraseña ---
        new_pass = _wait_for_element(driver, By.ID, "new_password")
        assert new_pass.is_displayed(), "Campo 'new_password' no visible"

        # --- Locator ID: campo confirmar contraseña ---
        confirm = driver.find_element(By.ID, "confirmPassword")
        assert confirm.is_displayed(), "Campo 'confirmPassword' no visible"

        # --- Locator XPath: botón de restablecer ---
        submit = driver.find_element(By.XPATH, '//button[@type="submit"]')
        assert submit.is_displayed(), "Botón de submit no visible"

        path = _screenshot(driver, f"{SCENARIO_PREFIX}b_formulario_campos")
        print(f"  ✅ PASS — Formulario con todos los campos")
        print(f"     new_password: ✅ | confirmPassword: ✅ | submit: ✅")
        print(f"     Screenshot: {path}")

    except Exception as e:
        _screenshot(driver, f"{SCENARIO_PREFIX}b_FAIL")
        print(f"  ❌ FAIL — {e}")
        raise
    finally:
        driver.quit()


if __name__ == "__main__":
    print(f"\n{'#'*60}")
    print(f"  SUITE: Restaurar Contraseña")
    print(f"{'#'*60}")
    passed, failed = 0, 0
    for test_fn in [
        test_03a_reset_password_pagina_carga,
        test_03b_reset_password_formulario_campos,
    ]:
        try:
            test_fn()
            passed += 1
        except Exception:
            failed += 1
    print(f"\n{'='*60}")
    print(f"  RESULTADO: {passed} pasaron, {failed} fallaron")
    print(f"{'='*60}")