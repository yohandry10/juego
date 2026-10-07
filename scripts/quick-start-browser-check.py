"""Check one-click entry and visible campaign spending in PC browsers."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

def exported(page):
    with page.expect_download() as download:
        page.get_by_role("button", name="Exportar partida").click()
    return json.loads(Path(download.value.path()).read_text(encoding="utf-8"))

results = []
with sync_playwright() as p:
    for engine in ["chromium", "firefox"]:
        browser = getattr(p, engine).launch(headless=True)
        for width in [1280, 1920]:
            for country, office in [("peru", "deputy"), ("mexico", "deputy"), ("france", "prime-minister"), ("peru", "senator")]:
                context = browser.new_context(viewport={"width": width, "height": 900}, accept_downloads=True)
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                assert page.goto(f"http://127.0.0.1:4173/?country={country}", wait_until="networkidle").status == 200
                page.get_by_label("Cargo inicial").select_option(office)
                page.get_by_label("Semilla de la partida").fill(f"quick-start-v1-{country}-{office}")
                budget_path = country == "peru" and office == "deputy"
                if budget_path:
                    page.get_by_label("Origen social").select_option("urban-working")
                page.get_by_role("button", name="Jugar ahora").click()
                page.get_by_role("heading", name="Elige una acción").wait_for()
                saved = exported(page)
                assert saved["stage"] == "campaign" and saved["player"]["name"] == "Alex Ríos"
                assert saved["campaign"]["officeId"] == office
                assert saved["player"]["age"] == (45 if office == "senator" else 30)
                assert saved["campaign"]["nominated"] is False
                assert page.get_by_role("button", name="Organizar un mitin").locator(".action-cost").inner_text() == "12k · 1 acción"
                assert page.get_by_role("button", name="Recaudar fondos").locator(".action-cost").inner_text() == "Recibes 12k · 1 acción"
                if budget_path:
                    page.get_by_role("button", name="Confirmar nominación").click()
                    for _ in range(2):
                        for _ in range(2):
                            page.get_by_role("button", name="Organizar un mitin").click()
                        page.get_by_role("button", name="Siguiente semana").click()
                    page.get_by_role("button", name="Organizar un mitin").click()
                    before = exported(page)
                    assert before["player"]["resources"]["campaignFunds"] == 10
                    assert page.get_by_role("button", name="Organizar un mitin").is_disabled()
                    assert page.get_by_role("button", name="Recorrer el distrito").is_enabled()
                    page.get_by_role("button", name="Recaudar fondos").click()
                    after = exported(page)
                    assert after["player"]["resources"]["campaignFunds"] == 22
                    assert after["campaign"]["playerPreferencePercent"] == before["campaign"]["playerPreferencePercent"]
                    page.get_by_role("button", name="Siguiente semana").click()
                    assert page.get_by_role("button", name="Organizar un mitin").is_enabled()
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2")
                assert not errors, errors
                if engine == "chromium" and width == 1280 and budget_path:
                    page.screenshot(path="docs/screenshots/quick-start-campaign.png", full_page=True)
                results.append({"engine": engine, "width": width, "country": country, "office": office,
                    "oneClickEntry": True, "nominationRequired": True, "visibleCosts": True,
                    "unaffordableActionAndFundraisingChecked": budget_path, "overflow": False, "errors": errors})
                context.close()
        browser.close()
Path("docs/quick-start-browser-evidence.json").write_text(json.dumps({"date": "2026-10-06", "results": results,
    "limitations": "Automated PC navigation, no proof of fun or human understanding. Six-step customization is retained; no new national rules."}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("OK: sixteen quick-start paths and four actual spending/recovery flows in Chromium/Firefox.")
