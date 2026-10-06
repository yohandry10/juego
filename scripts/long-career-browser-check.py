"""Check the PC inbox using an unchanged save from the real forty-year driver.

Prepare it with MANDATO_LONG_STATE_PATH set before validate:long-career.
The default fixture is mandato-long-pc-state.json in the system temp directory.
"""
import hashlib
import json
import math
import os
import tempfile
from pathlib import Path
from time import perf_counter
from playwright.sync_api import sync_playwright

fixture_path = Path(os.environ.get("MANDATO_LONG_STATE_PATH", str(Path(tempfile.gettempdir()) / "mandato-long-pc-state.json")))
raw_fixture = fixture_path.read_bytes()
fixture = json.loads(raw_fixture)
assert fixture["world"]["quarterIndex"] == 160
assert fixture["geopolitics"]["quarterIndex"] == 160
pending = [item for item in fixture["inbox"] if not item["resolved"]]
assert len(pending) > 400 and len(fixture["log"]) > 400
inbox_pages = math.ceil(len(pending) / 12)
diary_pages = math.ceil(len(fixture["log"]) / 20)
base_url = os.environ.get("MANDATO_BASE_URL", "http://127.0.0.1:4173")
results = []


def exported_state(page):
    with page.expect_download() as download:
        page.get_by_role("button", name="Exportar partida", exact=True).click()
    return json.loads(Path(download.value.path()).read_text(encoding="utf-8"))


with sync_playwright() as playwright:
    for engine in ["chromium", "firefox"]:
        browser = getattr(playwright, engine).launch(headless=True)
        for width in [1280, 1920]:
            context = browser.new_context(viewport={"width": width, "height": 900 if width == 1280 else 1080}, accept_downloads=True)
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            assert page.goto(f"{base_url}/?country=peru", wait_until="networkidle").status == 200
            # Load through the application's existing save store, with no edited metrics.
            page.evaluate("""save => new Promise((resolve, reject) => {
                const request=indexedDB.open('mandato-career',1);
                request.onupgradeneeded=()=>request.result.createObjectStore('saves');
                request.onerror=()=>reject(request.error);
                request.onsuccess=()=>{const db=request.result;
                    const transaction=db.transaction('saves','readwrite');
                    transaction.objectStore('saves').put(save,'active');
                    transaction.oncomplete=()=>{db.close();resolve();};
                    transaction.onerror=()=>{db.close();reject(transaction.error);};
                };
            })""", fixture)
            page.reload(wait_until="networkidle")
            page.get_by_role("button", name="Exportar partida", exact=True).wait_for()
            assert exported_state(page) == fixture, "Loading must preserve the entire old save."
            start = perf_counter()
            page.get_by_role("button", name="02 Bandeja", exact=True).click()
            articles = page.locator(".inbox-grid > article")
            articles.first.wait_for()
            open_ms = (perf_counter() - start) * 1000
            assert articles.count() == 12
            assert page.locator(".inbox-diary .log-list li").count() == 0
            if engine == "chromium" and width == 1280:
                page.evaluate("window.scrollTo(0,0)")
                page.screenshot(path="docs/screenshots/long-career-inbox-pc.png", full_page=False)
            # Every pending matter must be reachable, in the same recent-first order.
            seen = []
            while True:
                assert articles.count() <= 12
                seen.extend(articles.evaluate_all("nodes => nodes.map(n=>({title:n.querySelector('h3').innerText,body:n.querySelector('p').innerText}))"))
                next_page = page.get_by_role("button", name="Página siguiente de la bandeja", exact=True).first
                if next_page.is_disabled():
                    break
                next_page.click()
            assert seen == [{"title": item["title"], "body": item["body"]} for item in reversed(pending)]
            search = page.get_by_role("searchbox", name="Buscar en la bandeja")
            search.fill(pending[0]["body"])
            assert articles.count() == 1 and articles.first.get_by_role("heading").inner_text() == pending[0]["title"]
            search.fill("zzzz-no-existe-zzzz")
            assert articles.count() == 0
            assert page.get_by_text("No hay asuntos que coincidan con tu búsqueda.", exact=True).is_visible()
            search.fill("")
            page.get_by_label("Orden de la bandeja").select_option("oldest")
            assert articles.first.locator("p").first.inner_text() == pending[0]["body"]
            page.get_by_label("Orden de la bandeja").select_option("priority")
            priority_order = sorted(reversed(pending), key=lambda item: -item["priority"])
            assert articles.first.locator("p").first.inner_text() == priority_order[0]["body"]
            # Keyboard reaches and activates pagination; changing filters resets the page.
            next_page = page.get_by_role("button", name="Página siguiente de la bandeja", exact=True).first
            next_page.focus()
            page.keyboard.press("Enter")
            assert page.get_by_text(f"Página 2 de {inbox_pages}", exact=True).first.is_visible()
            page.get_by_role("button", name=f"Resueltas ({len(fixture['inbox']) - len(pending)})", exact=True).click()
            assert articles.count() == 0
            page.get_by_role("button", name=f"Pendientes ({len(pending)})", exact=True).click()
            assert page.get_by_text(f"Página 1 de {inbox_pages}", exact=True).first.is_visible()
            page.locator(".inbox-diary > summary").click()
            diary_entries = page.locator(".inbox-diary .log-list li")
            diary_entries.first.wait_for()
            assert diary_entries.count() == 20
            page.get_by_role("button", name="Página siguiente del diario", exact=True).click()
            assert page.get_by_text(f"Página 2 de {diary_pages}", exact=True).is_visible()
            diary_search = page.get_by_role("searchbox", name="Buscar en el diario")
            diary_search.fill(fixture["log"][0]["text"])
            assert diary_entries.count() >= 1
            assert page.get_by_text(fixture["log"][0]["text"], exact=True).is_visible()
            diary_search.fill("")
            assert exported_state(page) == fixture, "Browsing and filtering must not alter any decision or memory."
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (engine, width)
            # An actual public response remains usable after forty years.
            response = next(item for item in pending if any(option["actionType"] == "advance" for option in item["options"]))
            option = next(option for option in response["options"] if option["actionType"] == "advance")
            search.fill(response["body"])
            assert articles.count() == 1
            assert articles.first.get_by_text(option["consequenceHint"], exact=True).is_visible()
            articles.first.get_by_role("button", name=option["label"], exact=True).click()
            assert page.get_by_text(f"Respuesta registrada: {response['title']}.", exact=False).is_visible()
            assert page.get_by_role("button", name=f"Pendientes ({len(pending) - 1})", exact=True).is_visible()
            changed = exported_state(page)
            assert len(changed["inbox"]) == len(fixture["inbox"])
            assert next(item for item in changed["inbox"] if item["id"] == response["id"])["resolved"]
            assert len(changed["log"]) == len(fixture["log"]) + 1
            assert changed["world"]["quarterIndex"] == 160
            assert changed["relationships"] == fixture["relationships"]
            page.get_by_role("button", name="Resueltas (1)", exact=True).click()
            assert articles.count() == 1
            assert articles.first.get_by_text("Ya respondiste este asunto.", exact=False).is_visible()
            assert articles.first.get_by_role("button").count() == 0
            page.get_by_label("Importar partida").set_input_files(str(fixture_path))
            page.get_by_role("button", name=f"Pendientes ({len(pending)})", exact=True).wait_for()
            assert exported_state(page) == fixture
            page.get_by_role("button", name="08 Ayuda", exact=True).click()
            page.get_by_role("button", name="Muy grande", exact=True).click()
            assert page.evaluate("getComputedStyle(document.documentElement).fontSize") == "20px"
            page.get_by_role("button", name="02 Bandeja", exact=True).click()
            page.get_by_role("heading", name="Decisiones y actividad", exact=True).wait_for()
            assert page.evaluate("getComputedStyle(document.documentElement).fontSize") == "20px"
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (engine, width, "largest text")
            page.reload(wait_until="networkidle")
            page.get_by_role("button", name="Exportar partida", exact=True).wait_for()
            assert page.evaluate("getComputedStyle(document.documentElement).fontSize") == "20px"
            assert exported_state(page) == fixture
            assert not errors, errors
            results.append({"engine": engine, "viewport": {"width": width, "height": 900 if width == 1280 else 1080}, "years": 40, "pendingAccessible": len(seen), "maximumRenderedMatters": 12, "maximumRenderedDiaryEntries": 20, "openInboxMs": open_ms, "allPagesMatchSave": True, "keyboardPagination": True, "oldestSearch": True, "diarySearch": True, "filtersDoNotChangeSave": True, "resolvedMatterCannotBeAnsweredTwice": True, "importExportIdentical": True, "largestTextRootPx": 20, "textSizePersistsOutsideHelpAndOnReload": True, "noHorizontalOverflow": True, "pageErrors": errors})
            context.close()
        browser.close()

Path("docs/long-career-browser-evidence.json").write_text(json.dumps({"date": "2026-10-06", "platform": "PC", "fixtureSeed": fixture["seed"], "fixtureStateSha256": hashlib.sha256(raw_fixture).hexdigest(), "results": results, "limitations": "Una carrera legislativa, ventanas de escritorio, navegadores sin interfaz visible; no mide comprensión humana, lector de pantalla ni memoria gráfica."}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"OK: {len(pending)} asuntos y {len(fixture['log'])} recuerdos accesibles por páginas, búsqueda, teclado y guardado intacto en Chromium/Firefox para PC.")
