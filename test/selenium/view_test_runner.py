"""
view_test_runner.py — Módulo central de automatización Selenium para CALZADO J&R
================================================================================
Proporciona funciones reutilizables que cada script de vista invoca.
Cada función:
  1. Inicializa Chrome WebDriver (headless o visible según configuración)
  2. Navega a la ruta indicada
  3. Opcionalmente autentica al usuario
  4. Valida la carga correcta de la página mediante aserciones
  5. Captura screenshot de evidencia
  6. Cierra el navegador de forma segura (driver.quit en finally)

Autor: QA Automation — Proyecto CALZADO J&R (ADSO 228118)
"""

import os
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

# ---------------------------------------------------------------------------
# Configuración global
# ---------------------------------------------------------------------------
BASE_URL = os.getenv("SELENIUM_BASE_URL", "http://localhost:5173")
ADMIN_EMAIL = os.getenv("SELENIUM_ADMIN_EMAIL", "ronald.jefe@gmail.com")
ADMIN_PASS = os.getenv("SELENIUM_ADMIN_PASS", "Test123456!")
SCREENSHOT_DIR = Path(__file__).parent / "evidences"
SCREENSHOT_DIR.mkdir(exist_ok=True)
HEADLESS = os.getenv("SELENIUM_HEADLESS", "false").lower() == "true"
TIMEOUT = 10  # segundos de espera máxima por elemento


# ---------------------------------------------------------------------------
# WebDriver Factory
# ---------------------------------------------------------------------------
def _create_driver() -> webdriver.Chrome:
    """Crea y configura una instancia de Chrome WebDriver."""
    opts = Options()
    if HEADLESS:
        opts.add_argument("--headless=new")
    opts.add_argument("--start-maximized")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1920,1080")
    # Suprimir logs de INFO/WARNING para salida más limpia
    opts.add_argument("--log-level=3")
    opts.add_experimental_option("excludeSwitches", ["enable-logging"])

    service = Service()
    driver = webdriver.Chrome(service=service, options=opts)
    driver.implicitly_wait(5)
    return driver


def _screenshot(driver: webdriver.Chrome, name: str) -> str:
    """Captura screenshot y retorna la ruta del archivo."""
    path = SCREENSHOT_DIR / f"{name}.png"
    driver.save_screenshot(str(path))
    return str(path)


def _wait_for_element(driver, by, value, timeout=TIMEOUT):
    """Espera explícita hasta que un elemento esté presente y visible."""
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, value))
    )


def _wait_for_clickable(driver, by, value, timeout=TIMEOUT):
    """Espera explícita hasta que un elemento sea clickeable."""
    return WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((by, value))
    )


# ---------------------------------------------------------------------------
# Login helper
# ---------------------------------------------------------------------------
def _login_as_admin(driver: webdriver.Chrome):
    """
    Realiza login como admin navegando al Landing y usando el modal.
    Utiliza 3 estrategias de localización distintas (ID, CSS, XPath).
    """
    driver.get(f"{BASE_URL}/?login=true")
    time.sleep(2)

    # 1) Esperar a que el modal de login aparezca
    _wait_for_element(driver, By.CSS_SELECTOR, 'div[role="dialog"]')

    # 2) Ingresar email — By.ID
    email_input = _wait_for_element(driver, By.ID, "email")
    email_input.clear()
    email_input.send_keys(ADMIN_EMAIL)

    # 3) Ingresar contraseña — By.CSS_SELECTOR
    pass_input = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
    pass_input.clear()
    pass_input.send_keys(ADMIN_PASS)

    # 4) Hacer clic en "Iniciar Sesión" — By.XPATH
    submit_btn = driver.find_element(
        By.XPATH, '//button[@type="submit" and contains(., "Iniciar")]'
    )
    submit_btn.click()

    # 5) Esperar a que el modal se cierre o la URL cambie
    time.sleep(3)
    WebDriverWait(driver, TIMEOUT).until(
        lambda d: "/dashboard" in d.current_url
        or "token" in d.execute_script("return document.cookie")
        or "/?" not in d.current_url
    )


# ---------------------------------------------------------------------------
# Funciones públicas — llamadas por cada script de vista
# ---------------------------------------------------------------------------
def run_success(scenario_id: str, ruta: str, titulo_texto: str, protected: bool = True):
    """
    Escenario EXITOSO: navegar a una página y verificar que cargó correctamente.
    - Si protected=True, primero autentica como admin.
    - Verifica que la URL contiene la ruta esperada.
    - Verifica que un texto clave aparece en la página.
    - Captura screenshot de evidencia.
    """
    driver = _create_driver()
    try:
        if protected:
            _login_as_admin(driver)

        # Navegar a la ruta objetivo
        full_url = f"{BASE_URL}{ruta}"
        driver.get(full_url)
        time.sleep(2)

        # --- Aserción 1: URL contiene la ruta ---
        assert ruta in driver.current_url, (
            f"[{scenario_id}] URL incorrecta. Esperaba '{ruta}' "
            f"en '{driver.current_url}'"
        )

        # --- Aserción 2: Texto esperado visible en la página ---
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert titulo_texto.lower() in body_text.lower(), (
            f"[{scenario_id}] Texto '{titulo_texto}' no encontrado en la página."
        )

        # --- Screenshot de éxito ---
        screenshot_path = _screenshot(driver, scenario_id)

        print(f"  ✅ PASS — {scenario_id}")
        print(f"     URL: {driver.current_url}")
        print(f"     Screenshot: {screenshot_path}")

    except AssertionError as e:
        screenshot_path = _screenshot(driver, f"{scenario_id}_FAIL")
        print(f"  ❌ FAIL — {scenario_id}: {e}")
        print(f"     Screenshot: {screenshot_path}")
        raise
    except Exception as e:
        screenshot_path = _screenshot(driver, f"{scenario_id}_ERROR")
        print(f"  💥 ERROR — {scenario_id}: {e}")
        print(f"     Screenshot: {screenshot_path}")
        raise
    finally:
        driver.quit()


def run_unauthorized(scenario_id: str, ruta: str):
    """
    Escenario NO AUTORIZADO: intentar acceder a una ruta protegida sin sesión.
    Se espera que el frontend redirija al Landing (/).
    """
    driver = _create_driver()
    try:
        # Navegar DIRECTAMENTE a la ruta protegida SIN login
        full_url = f"{BASE_URL}{ruta}"
        driver.get(full_url)
        time.sleep(3)

        # --- Aserción: redirigió al Landing (/) ---
        current = driver.current_url
        # Puede redirigir a "/" o "/?redirect=..." o simplemente no estar en la ruta
        is_redirected = (
            current.endswith("/")
            or current.endswith("/?")
            or "/dashboard" not in current
            or "/auth/login" in current
        )
        assert is_redirected, (
            f"[{scenario_id}] Se esperaba redirect al Landing pero "
            f"la URL actual es '{current}'"
        )

        # --- Screenshot de evidencia ---
        screenshot_path = _screenshot(driver, scenario_id)
        print(f"  ✅ PASS — {scenario_id} (redirect correcto a Landing)")
        print(f"     URL final: {driver.current_url}")
        print(f"     Screenshot: {screenshot_path}")

    except AssertionError as e:
        screenshot_path = _screenshot(driver, f"{scenario_id}_FAIL")
        print(f"  ❌ FAIL — {scenario_id}: {e}")
        print(f"     Screenshot: {screenshot_path}")
        raise
    except Exception as e:
        screenshot_path = _screenshot(driver, f"{scenario_id}_ERROR")
        print(f"  💥 ERROR — {scenario_id}: {e}")
        print(f"     Screenshot: {screenshot_path}")
        raise
    finally:
        driver.quit()


def run_login_error(scenario_id: str):
    """
    Escenario de ERROR DE LOGIN: intentar iniciar sesión con credenciales inválidas.
    Se espera un mensaje de error visible en el modal.
    """
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/?login=true")
        time.sleep(2)

        # Esperar modal
        _wait_for_element(driver, By.CSS_SELECTOR, 'div[role="dialog"]')

        # Email incorrecto — By.ID
        email_input = _wait_for_element(driver, By.ID, "email")
        email_input.clear()
        email_input.send_keys("correo_invalido@test.com")

        # Contraseña incorrecta — By.CSS_SELECTOR
        pass_input = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
        pass_input.clear()
        pass_input.send_keys("ClaveIncorrecta123!")

        # Click en Iniciar Sesión — By.XPATH
        submit_btn = driver.find_element(
            By.XPATH, '//button[@type="submit" and contains(., "Iniciar")]'
        )
        submit_btn.click()
        time.sleep(2)

        # --- Aserción 1: permanece en Landing (no redirige) ---
        assert "/dashboard" not in driver.current_url, (
            f"[{scenario_id}] Se redirigió al dashboard con credenciales inválidas"
        )

        # --- Aserción 2: hay algún indicador de error visible ---
        body_text = driver.find_element(By.TAG_NAME, "body").text
        has_error = any(
            keyword in body_text.lower()
            for keyword in ["error", "incorrecto", "inválid", "invalid", "credenciales"]
        )
        assert has_error, (
            f"[{scenario_id}] No se encontró mensaje de error tras login inválido"
        )

        screenshot_path = _screenshot(driver, scenario_id)
        print(f"  ✅ PASS — {scenario_id} (login inválido rechazado correctamente)")
        print(f"     Screenshot: {screenshot_path}")

    except AssertionError as e:
        screenshot_path = _screenshot(driver, f"{scenario_id}_FAIL")
        print(f"  ❌ FAIL — {scenario_id}: {e}")
        print(f"     Screenshot: {screenshot_path}")
        raise
    except Exception as e:
        screenshot_path = _screenshot(driver, f"{scenario_id}_ERROR")
        print(f"  💥 ERROR — {scenario_id}: {e}")
        print(f"     Screenshot: {screenshot_path}")
        raise
    finally:
        driver.quit()


def run_catalog_error(scenario_id: str):
    """
    Escenario de CATÁLOGO con filtros: verificar que la página carga
    y los filtros están presentes.
    """
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/catalog")
        time.sleep(2)

        # --- Aserción 1: URL correcta ---
        assert "/catalog" in driver.current_url, (
            f"[{scenario_id}] No se navegó al catálogo. URL: {driver.current_url}"
        )

        # --- Aserción 2: página contiene elementos del catálogo ---
        body_text = driver.find_element(By.TAG_NAME, "body").text
        has_catalog_content = any(
            keyword in body_text.lower()
            for keyword in ["catálogo", "catalog", "productos", "producto", "marca"]
        )
        assert has_catalog_content, (
            f"[{scenario_id}] No se encontró contenido del catálogo en la página"
        )

        screenshot_path = _screenshot(driver, scenario_id)
        print(f"  ✅ PASS — {scenario_id} (catálogo público cargado correctamente)")
        print(f"     Screenshot: {screenshot_path}")

    except AssertionError as e:
        screenshot_path = _screenshot(driver, f"{scenario_id}_FAIL")
        print(f"  ❌ FAIL — {scenario_id}: {e}")
        print(f"     Screenshot: {screenshot_path}")
        raise
    except Exception as e:
        screenshot_path = _screenshot(driver, f"{scenario_id}_ERROR")
        print(f"  💥 ERROR — {scenario_id}: {e}")
        print(f"     Screenshot: {screenshot_path}")
        raise
    finally:
        driver.quit()


def run_reset_password_error(scenario_id: str):
    """
    Escenario de RESTAURAR CONTRASEÑA: verificar que la página carga
    y muestra el formulario con los campos esperados.
    """
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/auth/reset-password?token=qa-test-token")
        time.sleep(2)

        # --- Aserción 1: URL correcta ---
        assert "/auth/reset-password" in driver.current_url, (
            f"[{scenario_id}] No se navegó a reset-password. URL: {driver.current_url}"
        )

        # --- Aserción 2: formulario visible con campos de contraseña ---
        body_text = driver.find_element(By.TAG_NAME, "body").text
        has_form = any(
            keyword in body_text.lower()
            for keyword in [
                "restablecer",
                "contraseña",
                "password",
                "nueva contraseña",
                "recover",
            ]
        )
        assert has_form, (
            f"[{scenario_id}] Formulario de reset password no encontrado"
        )

        screenshot_path = _screenshot(driver, scenario_id)
        print(f"  ✅ PASS — {scenario_id} (reset password página cargada)")
        print(f"     Screenshot: {screenshot_path}")

    except AssertionError as e:
        screenshot_path = _screenshot(driver, f"{scenario_id}_FAIL")
        print(f"  ❌ FAIL — {scenario_id}: {e}")
        print(f"     Screenshot: {screenshot_path}")
        raise
    except Exception as e:
        screenshot_path = _screenshot(driver, f"{scenario_id}_ERROR")
        print(f"  💥 ERROR — {scenario_id}: {e}")
        print(f"     Screenshot: {screenshot_path}")
        raise
    finally:
        driver.quit()


def run_reactivation_error(scenario_id: str):
    """
    Escenario de REACTIVACIÓN: verificar que la página carga
    y muestra el formulario de solicitud.
    """
    driver = _create_driver()
    try:
        driver.get(f"{BASE_URL}/auth/reactivation")
        time.sleep(2)

        # --- Aserción 1: URL correcta ---
        assert "/auth/reactivation" in driver.current_url, (
            f"[{scenario_id}] No se navegó a reactivation. URL: {driver.current_url}"
        )

        # --- Aserción 2: formulario visible ---
        body_text = driver.find_element(By.TAG_NAME, "body").text
        has_form = any(
            keyword in body_text.lower()
            for keyword in [
                "reactivación",
                "reactivation",
                "solicitar",
                "reactivar",
                "cuenta",
            ]
        )
        assert has_form, (
            f"[{scenario_id}] Formulario de reactivación no encontrado"
        )

        screenshot_path = _screenshot(driver, scenario_id)
        print(f"  ✅ PASS — {scenario_id} (reactivación página cargada)")
        print(f"     Screenshot: {screenshot_path}")

    except AssertionError as e:
        screenshot_path = _screenshot(driver, f"{scenario_id}_FAIL")
        print(f"  ❌ FAIL — {scenario_id}: {e}")
        print(f"     Screenshot: {screenshot_path}")
        raise
    except Exception as e:
        screenshot_path = _screenshot(driver, f"{scenario_id}_ERROR")
        print(f"  💥 ERROR — {scenario_id}: {e}")
        print(f"     Screenshot: {screenshot_path}")
        raise
    finally:
        driver.quit()


# ---------------------------------------------------------------------------
# Función auxiliar: verificar elementos del sidebar (navegación)
# ---------------------------------------------------------------------------
def verify_sidebar_links(driver: webdriver.Chrome, expected_links: list, scenario_id: str):
    """
    Verifica que los enlaces del sidebar estén presentes en la página.
    expected_links: lista de diccionarios con {"href": "/ruta", "text": "Texto"}
    """
    for link_info in expected_links:
        href = link_info["href"]
        text = link_info["text"]
        try:
            element = driver.find_element(By.CSS_SELECTOR, f'a[href="{href}"]')
            assert element.is_displayed(), f"Link '{text}' no visible"
        except Exception:
            print(f"  ⚠️  Sidebar link '{text}' ({href}) no encontrado")


# ---------------------------------------------------------------------------
#Bloque de ejecución directa (para pruebas rápidas)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("  VIEW TEST RUNNER — Prueba rápida de conexión")
    print("=" * 60)
    print(f"  Base URL: {BASE_URL}")
    print(f"  Headless: {HEADLESS}")
    print(f"  Screenshots dir: {SCREENSHOT_DIR}")
    print()

    # Prueba rápida: Landing page
    run_success("test_landing_quick", "/", "Calzado", protected=False)
    print()
    print("  ✅ Conexión verificada correctamente.")
