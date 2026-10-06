import json
from pathlib import Path
from time import perf_counter
from playwright.sync_api import sync_playwright

results = []
with sync_playwright() as p:
    for engine in ["chromium", "firefox"]:
        browser = getattr(p, engine).launch(headless=True)
        context = browser.new_context(accept_downloads=True)
        page = context.new_page()
        errors = []
        worker_requests = []
        failed_requests = []
        console_errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("worker", lambda worker: worker_requests.append(worker.url))
        page.on("requestfailed", lambda request: failed_requests.append({"url": request.url, "failure": request.failure}))
        page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
        assert page.goto("http://127.0.0.1:4173/?country=peru", wait_until="networkidle").status == 200
        page.get_by_label("Nombre público").fill("Elena Cruz")
        page.get_by_label("Cargo inicial").select_option("president")
        page.get_by_label("Semilla de la partida").fill("phase2-president-smoke")
        for _ in range(5): page.get_by_role("button", name="Siguiente paso").click()
        page.get_by_label("Edad").fill("40")
        page.get_by_role("button", name="Empezar campaña").click()
        page.get_by_role("button", name="Confirmar nominación").click()
        for _ in range(4):
            page.get_by_role("button", name="Recorrer el distrito").click()
            page.get_by_role("button", name="Organizar un mitin").click()
            page.get_by_role("button", name="Siguiente semana").click()
        page.get_by_role("button", name="Iniciar mandato").click()
        page.get_by_role("heading", name="Trimestre 0 de 20", exact=True).wait_for()
        page.get_by_role("button", name="Negociar gobierno con", exact=False).first.click()
        page.wait_for_function("navigator.serviceWorker.controller !== null")
        context.set_offline(True)
        times = []
        for quarter in [1, 2]:
            start = perf_counter()
            page.get_by_role("button", name="Avanzar trimestre").click()
            page.get_by_role("heading", name=f"Trimestre {quarter} de 20", exact=True).wait_for()
            times.append((perf_counter() - start) * 1000)
        # The persistent worker must still be alive: a main-thread fallback
        # would terminate it and cannot satisfy this assertion.
        assert len(page.workers) == 1, {"engine": engine, "startedWorkers": worker_requests, "failedRequests": failed_requests, "consoleErrors": console_errors}
        worker = page.workers[0]
        assert worker.evaluate("typeof self.postMessage") == "function"
        with page.expect_download() as info:
            page.get_by_role("button", name="Exportar partida").click()
        saved = json.loads(Path(info.value.path()).read_text(encoding="utf-8"))
        assert saved["world"]["quarterIndex"] == 2
        assert saved["geopolitics"]["quarterIndex"] == 2
        assert saved["government"]["termTurn"] == 2
        assert saved["player"]["resources"]["politicalCapital"] == 30
        page.get_by_label("Ritmo del tiempo").select_option("decision")
        assert page.get_by_text("El tiempo espera por ti.", exact=True).is_visible()
        page.get_by_role("button", name="Avanzar trimestre").click()
        page.get_by_role("alert").filter(has_text="Bandeja").wait_for()
        page.get_by_role("heading", name="Trimestre 2 de 20", exact=True).wait_for()
        assert len(page.workers) == 1
        assert not errors, errors
        results.append({"engine": engine, "offline": True, "workerUrl": worker.url, "workerAliveAfterTurns": True, "quarters": 2, "governmentNegotiationCost": 5, "worldEconomyCareerSynchronized": True, "fastPaceWaitsForUnansweredChoice": True, "coldTurnMs": times[0], "warmTurnMs": times[1], "pageErrors": errors})
        context.close()
        browser.close()
Path("docs/career-worker-browser-evidence.json").write_text(json.dumps({"date": "2026-10-06", "profile": "peru", "office": "president", "results": results}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("OK: Chromium/Firefox avanzan carrera, economía y mundo en un Worker persistente sin red.")
