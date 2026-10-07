"""Check naturally obtained Mexican territorial victory/defeat in both PC engines."""
import json
from pathlib import Path
import tempfile
from playwright.sync_api import sync_playwright

folder = Path(tempfile.gettempdir()) / "mandato-mexico-election-browser"
manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
results = []
with sync_playwright() as p:
    for engine in ["chromium", "firefox"]:
        browser = getattr(p, engine).launch(headless=True)
        for width in [1280, 1920]:
            for fixture in manifest["fixtures"]:
                context = browser.new_context(viewport={"width": width, "height": 900}, accept_downloads=True)
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                assert page.goto("http://127.0.0.1:4173/?country=mexico", wait_until="networkidle").status == 200
                page.get_by_label("Nombre público").fill("Elena Ríos")
                for _ in range(5):
                    page.get_by_role("button", name="Siguiente paso").click()
                page.get_by_role("button", name="Empezar campaña").click()
                page.locator('input[type="file"]').set_input_files(folder / f"{fixture['id']}-before.json")
                page.get_by_role("button", name="Siguiente semana").click()
                page.locator(".result-banner").filter(has_text=fixture["explanation"]).wait_for()
                with page.expect_download() as downloaded:
                    page.get_by_role("button", name="Exportar partida").click()
                saved = json.loads(Path(downloaded.value.path()).read_text(encoding="utf-8"))
                assert saved == json.loads((folder / f"{fixture['id']}-result.json").read_text(encoding="utf-8"))
                assert saved["electionOutcome"]["playerListPosition"] is None
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2")
                if engine == "chromium" and width == 1280:
                    page.screenshot(path=f"docs/screenshots/mexico-election-{fixture['id']}.png", full_page=True)
                page.get_by_role("button", name="Iniciar mandato" if fixture["elected"] else "Ver cierre de carrera").click()
                with page.expect_download() as downloaded:
                    page.get_by_role("button", name="Exportar partida").click()
                started = json.loads(Path(downloaded.value.path()).read_text(encoding="utf-8"))
                assert started == json.loads((folder / f"{fixture['id']}-started.json").read_text(encoding="utf-8"))
                assert not errors, errors
                results.append({"engine": engine, "width": width, **fixture, "identicalResultAndStart": True, "overflow": False, "errors": errors})
                context.close()
        browser.close()
Path("docs/mexico-election-browser-evidence.json").write_text(json.dumps({"date": "2026-10-06", "protocol": manifest["protocol"], "results": results,
    "limitations": "Two naturally obtained outcomes in automated PC browsers. No human comprehension, screen reader or hardware coverage; no regional PR/Senate curation claim."}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("OK: natural win/loss, exact election/start exports, Chromium/Firefox at 1280/1920.")
