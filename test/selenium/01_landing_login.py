"""
01_landing_login.py — Pruebas de la Landing Page y Modal de Login
==================================================================
Caso 1: Verificar que la Landing carga correctamente (texto, navegación)
Caso 2: Login exitoso con credenciales válidas de admin
Caso 3: Login fallido con credenciales inválidas
"""

import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from view_test_runner import (
    BASE_URL, ADMIN_EMAIL, ADMIN_PASS,
    _create_driver, _screenshot, _wait_for_element,
)

SCENARIO_PREFIX = "01_landing_login"


def test_01a_landing_page_carga_correctamente():
    """Verifica que la Landing Page carga con su contenido principal."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}a — Landing Page carga correctamente")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        driver.get(BASE_URL)
        time.sleep(2)

        # --- Locator CSS: verificar logo ---
        logo = driver.find_element(By.CSS_SELECTOR, 'a[href="/"] img')
        assert logo.is_displayed(), "Logo no visible"

        # --- Locator CSS: verificar navegación ---
        nav = driver.find_element(
            By.CSS_SELECTOR, 'nav[aria-label="Navegación principal"]'
        )
        assert nav.is_displayed(), "Barra de navegación no visible"

        # --- Locator XPath: verificar botón "Iniciar Sesión" ---
        login_btn = driver.find_element(
            By.XPATH, '//button[contains(., "Iniciar Sesión")]'
        )
        assert login_btn.is_displayed(), "Botón 'Iniciar Sesión' no visible"

        # --- Locator CSS: verificar link al catálogo ---
        catalog_link = driver.find_element(By.CSS_SELECTOR, 'a[href="/catalog"]')
        assert catalog_link.is_displayed(), "Link al catálogo no visible"

        path = _screenshot(driver, f"{SCENARIO_PREFIX}a_landing_exitoso")
        print(f"  ✅ PASS — Landing carga correctamente")
        print(f"     Logo: ✅ | Nav: ✅ | Login btn: ✅ | Catálogo: ✅")
        print(f"     Screenshot: {path}")

    except Exception as e:
        _screenshot(driver, f"{SCENARIO_PREFIX}a_landing_FAIL")
        print(f"  ❌ FAIL — {e}")
        raise
    finally:
        driver.quit()


def test_01b_login_exitoso_admin():
    """Verifica login exitoso con credenciales de admin."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}b — Login exitoso (admin)")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/?login=true")
        time.sleep(2)

        # --- Locator CSS: modal abierto ---
        modal = _wait_for_element(driver, By.CSS_SELECTOR, 'div[role="dialog"]')
        assert modal.is_displayed(), "Modal de login no se abrió"

        # --- Locator ID: campo email ---
        email_input = _wait_for_element(driver, By.ID, "email")
        email_input.clear()
        email_input.send_keys(ADMIN_EMAIL)

        # --- Locator CSS: campo contraseña ---
        pass_input = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
        pass_input.clear()
        pass_input.send_keys(ADMIN_PASS)

        # --- Locator XPath: botón submit ---
        submit_btn = driver.find_element(
            By.XPATH, '//button[@type="submit" and contains(., "Iniciar")]'
        )
        submit_btn.click()
        time.sleep(3)

        # --- Aserción: redirige al dashboard ---
        assert "/dashboard" in driver.current_url, (
            f"No se redirigió al dashboard. URL: {driver.current_url}"
        )

        # --- Locator CSS: sidebar visible ---
        sidebar = driver.find_element(By.CSS_SELECTOR, 'aside nav')
        assert sidebar.is_displayed(), "Sidebar del dashboard no visible"

        path = _screenshot(driver, f"{SCENARIO_PREFIX}b_login_exitoso")
        print(f"  ✅ PASS — Login exitoso, redirigido al dashboard")
        print(f"     URL: {driver.current_url}")
        print(f"     Screenshot: {path}")

    except Exception as e:
        _screenshot(driver, f"{SCENARIO_PREFIX}b_login_FAIL")
        print(f"  ❌ FAIL — {e}")
        raise
    finally:
        driver.quit()


def test_01c_login_credenciales_invalidas():
    """Verifica que login con credenciales incorrectas no redirige."""
    print(f"\n{'='*60}")
    print(f"  {SCENARIO_PREFIX}c — Login fallido (credenciales inválidas)")
    print(f"{'='*60}")
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/?login=true")
        time.sleep(2)

        _wait_for_element(driver, By.CSS_SELECTOR, 'div[role="dialog"]')

        # Email inválido — By.ID
        email_input = _wait_for_element(driver, By.ID, "email")
        email_input.clear()
        email_input.send_keys("no_existe@correo.com")

        # Contraseña incorrecta — By.CSS_SELECTOR
        pass_input = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
        pass_input.clear()
        pass_input.send_keys("ContrasenaIncorrecta123!")

        # Submit — By.XPATH
        submit_btn = driver.find_element(
            By.XPATH, '//button[@type="submit" and contains(., "Iniciar")]'
        )
        submit_btn.click()
        time.sleep(2)

        # --- Aserción 1: NO redirige al dashboard ---
        assert "/dashboard" not in driver.current_url, (
            "Se redirigió al dashboard con credenciales inválidas"
        )

        # --- Aserción 2: permanece en Landing ---
        assert driver.current_url.startswith(BASE_URL), (
            f"URL inesperada: {driver.current_url}"
        )

        path = _screenshot(driver, f"{SCENARIO_PREFIX}c_login_error")
        print(f"  ✅ PASS — Login rechazado correctamente")
        print(f"     URL: {driver.current_url}")
        print(f"     Screenshot: {path}")

    except Exception as e:
        _screenshot(driver, f"{SCENARIO_PREFIX}c_login_error_FAIL")
        print(f"  ❌ FAIL — {e}")
        raise
    finally:
        driver.quit()


if __name__ == "__main__":
    print(f"\n{'#'*60}")
    print(f"  SUITE: Landing Page & Login")
    print(f"{'#'*60}")
    passed, failed = 0, 0
    for test_fn in [
        test_01a_landing_page_carga_correctamente,
        test_01b_login_exitoso_admin,
        test_01c_login_credenciales_invalidas,
    ]:
        try:
            test_fn()
            passed += 1
        except Exception:
            failed += 1
    print(f"\n{'='*60}")
    print(f"  RESULTADO: {passed} pasaron, {failed} fallaron")
    print(f"{'='*60}")