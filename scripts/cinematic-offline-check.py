"""Verify that the production office and all portraits survive loss of network."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
url = os.environ.get("MANDATO_BASE_URL", "http://127.0.0.1:4174").rstrip("/") + "/"
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1920, "height": 1080})
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(url)
    page.wait_for_load_state("networkidle")
    page.wait_for_function("navigator.serviceWorker.controller !== null")
    portraits = page.evaluate("""async () => {
      const names = await caches.keys();
      const cache = await caches.open(names.find(name => name.startsWith('mandato-shell-')));
      const keys = await cache.keys();
      return keys.map(key => new URL(key.url).pathname).filter(path => path.startsWith('/assets/portraits/'));
    }""")
    assert len(portraits) == 46, portraits
    scenes = page.evaluate("""async () => {
      const names=await caches.keys();const cache=await caches.open(names.find(name=>name.startsWith('mandato-shell-')));
      return (await cache.keys()).map(key=>new URL(key.url).pathname).filter(path=>path.startsWith('/assets/scenes/'));
    }""")
    assert len(scenes) == 27, scenes
    page.get_by_role("button", name="Elegir mi cargo", exact=False).click()
    page.get_by_role("button", name="Entrar al juego", exact=False).click()
    page.locator(".cinematic-desk").wait_for()
    context.set_offline(True)
    page.reload()
    page.wait_for_load_state("networkidle")
    page.locator(".desk-image").evaluate("img => img.decode()")
    page.get_by_role("button", name="Teléfono:").click()
    page.locator(".encounter-person img").evaluate("img => img.decode()")
    assert page.locator(".encounter-person img").evaluate("img => img.naturalWidth") == 512
    page.get_by_role("button", name="01 Recorrer el distrito", exact=False).click()
    page.get_by_role("dialog", name="Consecuencias de tu decisión").wait_for()
    assert "−3k" in page.locator(".encounter-consequences").inner_text()
    page.get_by_role("button", name="Volver al despacho", exact=False).last.click()
    page.reload()
    page.wait_for_load_state("networkidle")
    page.locator(".cinematic-desk").wait_for()
    assert "97K" in page.locator(".hud-coins").inner_text()
    assert not errors, errors
    context.close()
    fallback_context = browser.new_context(service_workers="block")
    fallback_page = fallback_context.new_page()
    fallback_page.route("**/assets/portraits/advisor-campaign.webp", lambda route: route.abort())
    fallback_page.goto(url)
    fallback_page.wait_for_load_state("networkidle")
    fallback_page.get_by_role("button", name="Elegir mi cargo", exact=False).click()
    fallback_page.get_by_role("button", name="Entrar al juego", exact=False).click()
    fallback_page.get_by_role("button", name="Teléfono:").click()
    fallback_page.locator(".encounter-person .asset-fallback").wait_for()
    assert "Retrato no disponible" in fallback_page.locator(".encounter-person").inner_text()
    assert fallback_page.locator(".encounter-person svg").count() == 0
    report = {"url": url, "status": "passed", "portraitsCached": len(portraits), "scenesCached":len(scenes), "offlineDecision": True, "restoredFunds": 97, "rasterFailureUsesPlaceholder": True, "consoleErrors": errors}
    evidence = Path(os.environ.get("MANDATO_QA_OFFLINE_EVIDENCE", str(root / "design/vertical-slice/offline-evidence.json")))
    evidence.parent.mkdir(parents=True, exist_ok=True)
    evidence.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    browser.close()
    print(json.dumps(report, ensure_ascii=False))
