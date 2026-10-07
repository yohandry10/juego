"""An isolated browser verifies the playable office, real results and restoration."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
output = root / "design/vertical-slice/capturas"
output.mkdir(parents=True, exist_ok=True)
evidence = {"url": "http://127.0.0.1:5174/", "runs": []}

with sync_playwright() as p:
    for width, height in [(2560, 1440), (1920, 1080), (1280, 720)]:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1)
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(evidence["url"])
        page.wait_for_load_state("networkidle")
        page.get_by_role("button", name="Elegir mi cargo", exact=False).click()
        page.get_by_role("button", name="Entrar al juego", exact=False).click()
        page.locator(".cinematic-desk").wait_for()
        page.evaluate("document.fonts.ready")
        page.locator(".desk-image").evaluate("img => img.decode()")
        initial_resources = page.locator(".hud-coins").inner_text()
        assert "35" in initial_resources and "100" in initial_resources
        assert page.locator(".game-portrait svg").count() == 0
        page.screenshot(path=str(output / f"despacho-{width}.png"))
        phone = page.get_by_role("button", name="Teléfono:")
        phone.click()
        page.locator(".encounter-person img").evaluate("img => img.decode()")
        page.locator(".office-encounter").evaluate("el => Promise.all(el.getAnimations({subtree:true}).map(a => a.finished))")
        assert "El primer apoyo" in page.locator(".encounter-document h2").inner_text()
        page.screenshot(path=str(output / f"conversacion-{width}.png"))
        first_choice = page.get_by_role("button", name="01 Recorrer el distrito", exact=False)
        page.keyboard.press("Tab")
        page.keyboard.press("Tab")
        assert first_choice.evaluate("el => el === document.activeElement && el.matches(':focus-visible')")
        page.screenshot(path=str(output / f"decision-{width}.png"))
        first_choice.press("Enter")
        page.get_by_role("dialog", name="Consecuencias de tu decisión").wait_for()
        assert "97K" in page.locator(".hud-coins").inner_text()
        assert "−3k" in page.locator(".encounter-consequences").inner_text()
        assert "−1" in page.locator(".encounter-consequences").inner_text()
        first_result = page.locator(".encounter-document").inner_text()
        page.locator(".office-encounter").evaluate("el => Promise.all(el.getAnimations({subtree:true}).map(a => a.finished))")
        page.screenshot(path=str(output / f"consecuencia-{width}.png"))
        page.get_by_role("button", name="Volver al despacho", exact=False).last.click()
        page.locator(".office-encounter").wait_for(state="detached")
        assert page.evaluate("document.activeElement.getAttribute('data-zone')") == "phone"
        assert "asunto" in page.locator(".desk-guidance").inner_text()
        page.mouse.move(1, 1)
        page.screenshot(path=str(output / f"regreso-{width}.png"))
        phone.click()
        assert "EXPEDIENTE SOBRE TU MESA" in page.locator(".document-overline").inner_text()
        page.locator(".encounter-person img").evaluate("img => img.decode()")
        page.locator(".office-encounter").evaluate("el => Promise.all(el.getAnimations({subtree:true}).map(a => a.finished))")
        page.screenshot(path=str(output / f"asunto-{width}.png"))
        event_title = page.locator(".encounter-document h2").inner_text()
        page.get_by_role("button", name="Responder públicamente", exact=False).click()
        page.get_by_role("dialog", name="Consecuencias de tu decisión").wait_for()
        assert "+0,4 pp" in page.locator(".encounter-consequences").inner_text()
        second_result = page.locator(".encounter-document").inner_text()
        page.locator(".office-encounter").evaluate("el => Promise.all(el.getAnimations({subtree:true}).map(a => a.finished))")
        page.screenshot(path=str(output / f"respuesta-{width}.png"))
        page.get_by_role("button", name="Volver al despacho", exact=False).last.click()
        page.get_by_role("button", name="Organizar campaña", exact=False).click()
        page.locator(".office-encounter").wait_for()
        assert page.locator(".campaign-scene-actions").count() == 0
        assert not page.get_by_role("button", name="Organizar campaña", exact=False).is_visible()
        page.keyboard.press("Shift+Tab")
        assert page.evaluate("document.activeElement.textContent").find("Consultar el archivo") >= 0
        page.keyboard.press("Tab")
        assert page.evaluate("document.activeElement.getAttribute('aria-label')") == "Cerrar conversación y volver al despacho"
        page.keyboard.press("Escape")
        page.locator(".office-encounter").wait_for(state="detached")
        assert page.evaluate("document.activeElement.textContent").find("Organizar campaña") >= 0
        phone.click()
        page.get_by_role("button", name="Consultar el archivo", exact=True).click()
        page.get_by_role("button", name="MANDATO · Volver al despacho", exact=True).click()
        page.locator(".cinematic-desk").wait_for()
        assert page.locator(".office-encounter").count() == 0
        page.reload()
        page.wait_for_load_state("networkidle")
        page.locator(".cinematic-desk").wait_for()
        assert "97K" in page.locator(".hud-coins").inner_text()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert page.locator(".desk-image").evaluate("img => img.complete && img.naturalWidth > 0")
        assert not errors, errors
        evidence["runs"].append({"viewport": [width, height], "status": "passed", "event": event_title,
                                  "campaignResult": first_result, "eventResult": second_result,
                                  "keyboardEscapeAndFocus": True, "restoredFunds": 97, "consoleErrors": errors})
        browser.close()
        print(f"Passed: {width} x {height}", flush=True)

(root / "design/vertical-slice/browser-evidence.json").write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
