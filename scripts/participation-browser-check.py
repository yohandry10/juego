"""Validate dated suspension and restored participation using natural generated starts."""
import json
import os
from pathlib import Path
import tempfile
from playwright.sync_api import sync_playwright

folder = Path(tempfile.gettempdir()) / "mandato-participation-browser"
manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
base = os.environ.get("MANDATO_BASE_URL", "http://127.0.0.1:4173")
results = []
with sync_playwright() as p:
    for engine in ["chromium", "firefox"]:
        browser = getattr(p, engine).launch(headless=True)
        for fixture in manifest["fixtures"]:
            context = browser.new_context(viewport={"width": 1280, "height": 900}, accept_downloads=True)
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            assert page.goto(base + "/?country=" + fixture["countryId"], wait_until="networkidle").status == 200
            page.get_by_label("Nombre público").fill("Elena Ríos")
            for _ in range(5):
                page.get_by_role("button", name="Siguiente paso").click()
            page.get_by_role("button", name="Empezar campaña").click()
            page.locator('input[type="file"]').set_input_files(folder / (fixture["actorId"] + ".json"))
            page.get_by_role("button", name="06 Mundo").click()
            card = page.get_by_role("article").filter(has=page.get_by_text("Unión Africana", exact=True))
            message = "Tu país es miembro, pero la fuente del escenario conserva una suspensión de participación. Mejorar la estabilidad no la elimina." if fixture["suspended"] else "Tu país cumple las condiciones del juego para recibir beneficios de los acuerdos colectivos."
            card.get_by_text(message, exact=True).wait_for()
            card.get_by_text("Ver membresía y condiciones", exact=True).click()
            assert "síntesis" in card.inner_text().lower()
            if fixture["suspended"]:
                assert card.get_by_role("link", name="Ver fundamento de la suspensión").get_attribute("href").startswith("https://")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2")
            with page.expect_download() as download:
                page.get_by_role("button", name="Exportar partida").click()
            exported = json.loads(Path(download.value.path()).read_text(encoding="utf-8"))
            expected = json.loads((folder / (fixture["actorId"] + ".json")).read_text(encoding="utf-8"))
            assert exported == expected, "Inspecting source/eligibility must not alter the save."
            assert not errors, errors
            if engine == "chromium" and fixture["actorId"] in ["mdg", "gin"]:
                card.screenshot(path="docs/screenshots/participation-" + fixture["actorId"] + ".png")
            results.append({"engine": engine, **fixture, "membershipPreserved": True, "statusExplained": True, "sourceLinkPresent": fixture["suspended"], "importExportIdentical": True, "noHorizontalOverflow": True, "pageErrors": errors})
            context.close()
        browser.close()
Path("docs/participation-browser-evidence.json").write_text(json.dumps({"date": "2026-10-06", "protocol": manifest["protocol"], "results": results, "scope": "Six restrictions and two restored participants in generated institutional scenarios. Automated PC browser test; no claim of current constitutional curation or human comprehension."}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("OK: sixteen generated paths, six suspensions and two restored participants; membership, sources and exact saves in Chromium/Firefox.")
