from playwright.sync_api import sync_playwright
import json
import os
from pathlib import Path


COUNTRIES = {
    "peru": "Perú",
    "spain": "España",
    "france": "Francia",
    "germany": "Alemania",
    "argentina": "Argentina",
    "brazil": "Brasil",
    "united-states": "Estados Unidos",
    "united-kingdom": "Reino Unido",
    "mexico": "México",
    "venezuela": "Venezuela",
    "generated-abw": "Aruba · escenario generado",
    "generated-ven": "Venezuela, RB · escenario generado",
    "generated-usa": "United States · escenario generado",
}

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    results = []
    base_url = os.environ.get("MANDATO_BASE_URL", "http://127.0.0.1:5173")
    for country_id, country_name in COUNTRIES.items():
        page = browser.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        response = page.goto(f"{base_url}/?country={country_id}", wait_until="networkidle")
        assert response and response.status == 200, f"El servidor no sirve la página: {base_url}, HTTP {response.status if response else 'sin respuesta'}"
        assert page.title(), "El servidor no entregó el documento del juego"
        page.get_by_label("País de inicio").select_option(country_id)
        assert page.locator(".country-inline strong").inner_text() == country_name
        page.get_by_label("Nombre público").fill("Elena Ríos")
        page.get_by_label("Semilla de la partida").fill(f"country-start-{country_id}")
        for _ in range(5):
            page.get_by_role("button", name="Siguiente paso").click()
        page.get_by_role("button", name="Empezar campaña").click()
        page.get_by_role("heading", name="Elige una acción").wait_for()
        assert not errors, f"{country_id}: {errors}"
        print(f"OK: {country_name} carga y comienza una campaña.")
        results.append({"country": country_id, "httpStatus": response.status, "campaignStarted": True, "pageErrors": errors})
        page.close()
    browser.close()
    Path("docs/country-browser-evidence.json").write_text(json.dumps({"date": "2026-10-06", "browser": "Chromium", "baseUrl": base_url, "results": results}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
