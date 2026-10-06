"""Real-command checkpoints; browser validates approval, pause, recovery and costs.

Prepare once with: node --import tsx scripts/prepare-financing-fixtures.ts
"""
import json
import os
from pathlib import Path
import tempfile
from playwright.sync_api import sync_playwright

folder = Path(tempfile.gettempdir()) / "mandato-financing-browser"
manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
base = os.environ.get("MANDATO_BASE_URL", "http://127.0.0.1:4173")
evidence = []


def exported(page):
    with page.expect_download() as info:
        page.get_by_role("button", name="Exportar partida").click()
    return json.loads(Path(info.value.path()).read_text(encoding="utf-8"))


def no_overflow(page):
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"), page.evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth})")


with sync_playwright() as p:
    for engine in ["chromium", "firefox"]:
        browser = getattr(p, engine).launch(headless=True)
        for viewport in [{"width": 1280, "height": 900}, {"width": 1920, "height": 1080}]:
            context = browser.new_context(viewport=viewport, accept_downloads=True)
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            assert page.goto(base + "/?country=peru", wait_until="networkidle").status == 200
            page.get_by_label("Nombre público").fill("Elena Ríos")
            for _ in range(5):
                page.get_by_role("button", name="Siguiente paso").click()
            page.get_by_role("button", name="Empezar campaña").click()
            page.locator('input[type="file"]').set_input_files(folder / "pending.json")
            page.get_by_role("heading", name="Trimestre 0 de 20", exact=True).wait_for()
            page.get_by_role("button", name="06 Mundo").click()
            card = page.get_by_role("article", name="Apoyo del FMI", exact=True)
            card.get_by_text("Solicitud pendiente de votación", exact=True).wait_for()
            card.get_by_role("button", name="Someter a votación").click()
            card.get_by_text("Aprobado: primera entrega pendiente", exact=True).wait_for()
            no_overflow(page)
            states = []
            for quarter in range(1, 6):
                page.get_by_role("button", name="01 Carrera").click()
                page.get_by_role("button", name="Avanzar trimestre", exact=False).click()
                page.get_by_role("heading", name=f"Trimestre {quarter} de 20", exact=True).wait_for()
                page.get_by_role("button", name="06 Mundo").click()
                expected = "Próxima entrega en pausa" if quarter in [3, 4] else "Préstamo en marcha"
                card.get_by_text(expected, exact=True).wait_for()
                no_overflow(page)
                states.append({"quarter": quarter, "visibleStatus": expected})
            # Actual repayment liability and reviews come from the Worker, not UI text.
            if engine == "chromium":
                card.screenshot(path=f"docs/screenshots/financing-{viewport["width"]}.png")
            saved = exported(page)
            program = next(t["financing"] for t in saved["geopolitics"]["treaties"] if t["partnerId"] == "imf")
            assert program["tranches"] == 2 and program["disbursedPercentGdp"] == 4
            assert [r["passed"] for r in program["reviews"]] == [True, False, True]
            assert saved["world"]["quarterIndex"] == saved["geopolitics"]["quarterIndex"] == 5
            # Proactive player action: restoring an authentic checkpoint is explicit.
            page.locator('input[type="file"]').set_input_files(folder / "before-review.json")
            page.get_by_role("button", name="06 Mundo").click()
            card.get_by_text("Falta cumplir tu compromiso.", exact=True).wait_for()
            before = exported(page)
            card.get_by_role("button", name="Ajustar el gasto · 4 de capital", exact=True).click()
            card.get_by_text("Ya aplicaste este compromiso en el trimestre.", exact=False).wait_for()
            after = exported(page)
            assert before["player"]["resources"]["politicalCapital"] - after["player"]["resources"]["politicalCapital"] == 4
            assert round(before["world"]["economy"]["indicators"]["fiscalDeficitPercentGdp"] - after["world"]["economy"]["indicators"]["fiscalDeficitPercentGdp"], 2) == 0.6
            # The economy keeps all 20 explanations, with four shown first.
            page.get_by_role("button", name="05 Economía").click()
            page.get_by_role("heading", name="Empleo, precios y bienestar").wait_for()
            assert page.locator(".economy-overview > div").count() == 4
            assert page.locator(".country-facts details summary").count() == 20
            page.get_by_label("Política económica").select_option("health-spending")
            assert page.get_by_text("Destinar más recursos a la salud", exact=True).count() >= 1
            no_overflow(page)
            assert not errors, errors
            evidence.append({"engine": engine, "viewport": viewport, "seed": manifest["seed"], "checkpointProtocol": manifest["protocol"], "approvalPauseRecovery": states, "tranches": 2, "commitmentCost": 4, "economicExplanations": 20, "horizontalOverflow": False, "pageErrors": errors})
            context.close()
        browser.close()
Path("docs/financing-browser-evidence.json").write_text(json.dumps({"date": "2026-10-06", "platformScope": "PC", "baseUrl": base, "humanTest": False, "results": evidence}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("OK: PC, Chromium/Firefox, 1280/1920 px; aprobación, suspensión, recuperación, compromiso con costo y economía comprensible.")
