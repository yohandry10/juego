from playwright.sync_api import sync_playwright
import json
from pathlib import Path

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    response = page.goto("http://127.0.0.1:4173/?country=venezuela", wait_until="networkidle")
    assert response.status == 200
    page.get_by_label("Variante de escenario").select_option("hegemony")
    page.get_by_label("Nombre público").fill("Elena Ríos")
    page.get_by_label("Semilla de la partida").fill("regime-playable")
    for _ in range(5): page.get_by_role("button", name="Siguiente paso").click()
    page.get_by_label("Edad", exact=True).fill("35")
    page.get_by_role("button", name="Empezar campaña").click()
    page.get_by_role("button", name="Confirmar nominación").click()
    for _ in range(4):
        page.get_by_role("button", name="Recorrer el distrito").click()
        page.get_by_role("button", name="Organizar un mitin").click()
        page.get_by_role("button", name="Siguiente semana").click()
    page.get_by_role("button", name="Iniciar mandato").click()
    page.get_by_role("heading", name="Apoyos y legitimidad").wait_for()
    page.get_by_role("button", name="Restringir las reuniones públicas", exact=False).click()
    assert page.get_by_text("La restricción causa daño a derechos", exact=False).first.is_visible()
    assert not errors, errors
    Path("docs/regime-browser-evidence.json").write_text(json.dumps({"date": "2026-10-06", "browser": "Chromium", "profile": "venezuela", "scenario": "optional-fictional-hegemony", "executiveStarted": True, "restrictionCostsVisible": True, "pageErrors": errors}, indent=2) + "\n", encoding="utf-8")
    browser.close()
print("OK: escenario hegemónico opcional, gobierno activo y costos visibles en navegador.")
