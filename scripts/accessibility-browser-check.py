import json
from pathlib import Path
from playwright.sync_api import sync_playwright

evidence = []
with sync_playwright() as p:
    for engine in ["chromium", "firefox"]:
        browser = getattr(p, engine).launch(headless=True)
        for viewport in [{"width": 1280, "height": 900}, {"width": 1920, "height": 1080}]:
            context = browser.new_context(viewport=viewport, reduced_motion="reduce")
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            response = page.goto("http://127.0.0.1:4173/", wait_until="networkidle")
            assert response.status == 200
            help_button = page.get_by_role("button", name="08 Ayuda")
            help_button.focus()
            page.keyboard.press("Enter")
            page.get_by_role("heading", name="Primeros diez minutos").wait_for()
            page.get_by_role("button", name="Grande", exact=True).click()
            assert page.evaluate("getComputedStyle(document.documentElement).fontSize") == "18px"
            assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"), f"overflow {engine}/{viewport}"
            page.wait_for_function("navigator.serviceWorker.controller !== null")
            context.set_offline(True)
            # These profiles were never fetched by this page: installation must cache all ten.
            for country in ["brazil", "mexico", "argentina", "venezuela"]:
                page.goto(f"http://127.0.0.1:4173/?country={country}", wait_until="networkidle")
                assert page.get_by_label("País de inicio").input_value() == country
            assert not errors, errors
            evidence.append({"engine": engine, "viewport": viewport, "emulatedViewport": True, "keyboardHelp": True, "largeTextRootPx": 18, "noHorizontalOverflow": True, "reducedMotionRequested": True, "offlineNewProfiles": True, "errors": errors})
            context.close()
        browser.close()
Path("docs/accessibility-browser-evidence.json").write_text(json.dumps({"date": "2026-10-06", "platformScope": "PC", "limitations": "Ventanas de escritorio automatizadas; no lector de pantalla ni cobertura de todo hardware PC. Contraste medido por phase5-browser-check.py en Ayuda.", "results": evidence}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("OK: PC, Chromium y Firefox, 1280/1920 px; teclado, texto, ausencia de desbordamiento y perfiles offline.")
