"""Verify ten national procedures in Chromium and Firefox using actual-command saves."""
import json
import os
from pathlib import Path
import tempfile
from playwright.sync_api import sync_playwright

folder = Path(tempfile.gettempdir()) / "mandato-ratification-browser"
manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
base = os.environ.get("MANDATO_BASE_URL", "http://127.0.0.1:4173")
evidence = []

with sync_playwright() as p:
    for engine in ["chromium", "firefox"]:
        browser = getattr(p, engine).launch(headless=True)
        for fixture in manifest["fixtures"]:
            country = fixture["countryId"]
            context = browser.new_context(viewport={"width": 1280, "height": 900}, accept_downloads=True)
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            assert page.goto(base + "/?country=" + country, wait_until="networkidle").status == 200
            page.get_by_label("Nombre público").fill("Elena Ríos")
            for _ in range(5):
                page.get_by_role("button", name="Siguiente paso").click()
            page.get_by_role("button", name="Empezar campaña").click()
            page.locator('input[type="file"]').set_input_files(folder / f"{country}-pending.json")
            page.get_by_role("button", name="06 Mundo").click()
            review = page.get_by_role("button", name=fixture["reviewLabel"], exact=True)
            page.get_by_text(fixture["ruleSummary"], exact=False).wait_for()
            assert review.is_disabled() == fixture["waiting"]
            if fixture["waiting"]:
                page.get_by_text("Avanza un trimestre", exact=False).wait_for()
                page.locator('input[type="file"]').set_input_files(folder / f"{country}-ready.json")
                page.get_by_role("button", name="06 Mundo").click()
            review.click()
            page.get_by_text(fixture["voteTitle"], exact=False).first.wait_for()
            with page.expect_download() as download:
                page.get_by_role("button", name="Exportar partida").click()
            saved = json.loads(Path(download.value.path()).read_text(encoding="utf-8"))
            expected = json.loads((folder / f"{country}-expected.json").read_text(encoding="utf-8"))
            assert saved == expected, f"{engine}/{country}: browser outcome differs from actual command"
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2")
            assert not errors, errors
            if engine == "chromium" and country in ["peru", "united-kingdom"]:
                page.screenshot(path=f"docs/screenshots/ratification-{country}.png", full_page=True)
            evidence.append({"engine": engine, **fixture, "identicalCommandState": True, "overflow": False, "errors": errors})
            context.close()
        browser.close()

Path("docs/ratification-browser-evidence.json").write_text(json.dumps({"date": "2026-10-06", "protocol": manifest["protocol"], "results": evidence,
    "limitations": "Natural legislative checkpoints, one seed per national procedure; no fabricated chamber support. Rare disagreements and threshold boundaries are covered by domain tests, not claimed as these browser paths. No human comprehension or screen-reader evidence."}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("OK: ten national procedures in Chromium/Firefox; exact command outcomes, waiting, costs and export.")
