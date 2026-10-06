from playwright.sync_api import sync_playwright


COUNTRIES = {
    "peru": "Perú",
    "spain": "España",
    "france": "Francia",
    "germany": "Alemania",
}

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for country_id, country_name in COUNTRIES.items():
        page = browser.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(f"http://127.0.0.1:5173/?country={country_id}", wait_until="networkidle")
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
        page.close()
    browser.close()
