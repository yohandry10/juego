import re
import tempfile
import time
from playwright.sync_api import sync_playwright


def next_step(page):
    step = page.get_by_text(re.compile(r"CREA TU PERSONAJE · PASO [1-6] DE 6"))
    previous = step.inner_text()
    page.get_by_role("button", name="Siguiente paso").click()
    page.wait_for_function("previous => !document.body.innerText.includes(previous)", arg=previous)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        executable_path=r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        headless=True,
    )
    page = browser.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto("http://127.0.0.1:5173", wait_until="networkidle")
    assert page.get_by_text("Tu nombre aún", exact=False).is_visible()
    assert page.get_by_label("Nivel de realismo").input_value() == "realistic"
    page.get_by_label("Nombre público").fill("Lucía Salas")
    page.get_by_label("Semilla de la partida").fill("phase1-browser-smoke")
    next_step(page)
    for _ in range(4):
        next_step(page)
    page.get_by_role("button", name="Empezar campaña").click()
    assert page.get_by_text("Semana 1 de 4").is_visible()
    page.get_by_role("button", name="Confirmar nominación").click()
    for week in range(4):
        for action in ["Recorrer el distrito", "Organizar un mitin"]:
            page.get_by_role("button", name=action).click()
        page.get_by_role("button", name="Siguiente semana").click()
    assert page.get_by_text("Resultado electoral").is_visible()
    assert page.get_by_text("ESCAÑO GANADO").is_visible()
    page.get_by_role("button", name="Iniciar mandato").click()
    assert page.get_by_text("Sesión 0 de 20").is_visible()
    turn_started = time.perf_counter()
    page.get_by_role("button", name="Votar a favor").click()
    turn_elapsed = time.perf_counter() - turn_started
    assert turn_elapsed < 2, f"La votación tardó {turn_elapsed:.2f}s"
    assert page.get_by_text("aprobada", exact=False).count() > 0 or page.get_by_text("rechazada", exact=False).count() > 0
    page.reload(wait_until="networkidle")
    page.get_by_role("button", name="03 Congreso").click()
    assert page.get_by_role("heading", name="Lucía Salas").is_visible()
    page.locator(".vote-report summary").first.click()
    assert page.get_by_text("Votos afirmativos", exact=False).is_visible()
    with tempfile.TemporaryDirectory() as directory:
        with page.expect_download() as download:
            page.get_by_role("button", name="Exportar partida").click()
        exported = download.value
        save_path = f"{directory}/{exported.suggested_filename}"
        exported.save_as(save_path)
        page.locator('input[type="file"]').set_input_files(save_path)
        assert page.get_by_role("heading", name="Lucía Salas").is_visible()
    parliamentary = browser.new_page()
    parliamentary.on("pageerror", lambda error: errors.append(str(error)))
    parliamentary.goto("http://127.0.0.1:5173/?country=spain", wait_until="networkidle")
    assert parliamentary.get_by_text("parliamentary", exact=False).is_visible()
    assert parliamentary.get_by_label("País de inicio").input_value() == "spain"
    parliamentary.get_by_label("Nombre público").fill("Lucía Rivas")
    parliamentary.get_by_label("Circunscripción").select_option("madrid")
    parliamentary.get_by_label("Semilla de la partida").fill("phase2-spain-smoke-11")
    next_step(parliamentary)
    for _ in range(4):
        next_step(parliamentary)
    parliamentary.get_by_role("button", name="Empezar campaña").click()
    parliamentary.get_by_role("button", name="Confirmar nominación").click()
    for _ in range(4):
        for action in ["Recorrer el distrito", "Organizar un mitin"]:
            parliamentary.get_by_role("button", name=action).click()
        parliamentary.get_by_role("button", name="Siguiente semana").click()
    assert parliamentary.get_by_text("ESCAÑO GANADO").is_visible()
    parliamentary.get_by_role("button", name="Iniciar mandato").click()
    parliamentary.get_by_role("button", name="Presentar candidatura a la investidura").click()
    # Each party is approached once; a rejected agreement is no longer guaranteed.
    partners = parliamentary.get_by_role("button", name="Negociar con", exact=False).all_text_contents()
    for partner in partners:
        button = parliamentary.get_by_role("button", name=partner, exact=True)
        if button.count() and button.is_enabled():
            button.click()
    parliamentary.get_by_role("button", name="Votar investidura").click()
    if parliamentary.get_by_role("button", name="Votar investidura").count():
        parliamentary.get_by_role("button", name="Votar investidura").click()
    assert parliamentary.get_by_text("Gobierno en funciones", exact=True).is_visible()
    assert parliamentary.get_by_text("PRESUPUESTO ANUAL", exact=True).is_visible()
    presidential = browser.new_page()
    presidential.on("pageerror", lambda error: errors.append(str(error)))
    presidential.goto("http://127.0.0.1:5173/?country=peru", wait_until="networkidle")
    presidential.get_by_label("Nombre público").fill("Elena Cruz")
    presidential.get_by_label("Cargo inicial").select_option("president")
    presidential.get_by_label("Semilla de la partida").fill("phase2-president-smoke")
    next_step(presidential)
    for _ in range(4):
        next_step(presidential)
    presidential.get_by_label("Edad").fill("40")
    presidential.get_by_role("button", name="Empezar campaña").click()
    presidential.get_by_role("button", name="Confirmar nominación").click()
    for _ in range(4):
        for action in ["Recorrer el distrito", "Organizar un mitin"]:
            presidential.get_by_role("button", name=action).click()
        presidential.get_by_role("button", name="Siguiente semana").click()
    assert presidential.get_by_text("CARGO EJECUTIVO GANADO").is_visible()
    presidential.get_by_role("button", name="Iniciar mandato").click()
    government_turn_started = time.perf_counter()
    presidential.get_by_role("button", name="Avanzar trimestre").click()
    presidential.wait_for_function("document.querySelector(\"main.app-shell\").getAttribute(\"aria-busy\") === \"false\"")
    government_turn_elapsed = time.perf_counter() - government_turn_started
    print(f"Turno ejecutivo normal: {government_turn_elapsed:.3f}s")
    assert government_turn_elapsed < 2, f"El turno ejecutivo tardó {government_turn_elapsed:.2f}s"
    assert presidential.get_by_text("MANDATO EN CURSO").is_visible()
    assert presidential.get_by_text("ESTABILIDAD DEL GOBIERNO").is_visible()
    for _ in range(3):
        presidential.get_by_role("button", name="Avanzar trimestre").click()
        presidential.wait_for_function("document.querySelector(\"main.app-shell\").getAttribute(\"aria-busy\") === \"false\"")
    presidential.get_by_role("button", name="02 Bandeja").click()
    presidential.get_by_role("button", name="Priorizar servicios").click()
    presidential.locator(".inbox-diary > summary").click()
    presidential.get_by_role("searchbox", name="Buscar en el diario").fill("Votación nominal")
    assert presidential.locator(".inbox-diary .log-list p").filter(has_text="Votación nominal").first.is_visible()
    presidential.get_by_role("button", name="01 Carrera").click()
    assert presidential.get_by_text("PRESUPUESTO ANUAL", exact=True).is_visible()
    assert presidential.get_by_text("Actas de votación presupuestaria", exact=False).count() > 0
    for _ in range(16):
        presidential.get_by_role("button", name="Avanzar trimestre").click()
        presidential.wait_for_function("document.querySelector(\"main.app-shell\").getAttribute(\"aria-busy\") === \"false\"")
    assert presidential.get_by_text("MANDATO CERRADO").is_visible()
    presidential.get_by_role("button", name="Postular a ministro de Economía").click()
    presidential.get_by_role("button", name="Confirmar candidatura").click()
    for _ in range(4):
        for action in ["Demostrar resultados", "Presentar agenda al ejecutivo"]:
            presidential.get_by_role("button", name=action).click()
        presidential.get_by_role("button", name="Siguiente semana").click()
    assert presidential.get_by_text("NOMBRAMIENTO MINISTERIAL OBTENIDO").is_visible()
    presidential.get_by_role("button", name="Iniciar ministerio").click()
    assert presidential.get_by_text("MINISTERIO EN FUNCIONES", exact=False).is_visible()
    presidential.get_by_role("button", name="Entregar resultados").click()
    presidential.get_by_role("button", name="Negociar recursos").click()
    for _ in range(8):
        presidential.get_by_role("button", name="Avanzar trimestre").click()
        presidential.wait_for_function("document.querySelector(\"main.app-shell\").getAttribute(\"aria-busy\") === \"false\"")
    assert presidential.get_by_text("MANDATO CERRADO").is_visible()
    presidential.get_by_role("button", name="Competir por", exact=False).click()
    assert presidential.get_by_text("Semana 1 de 4").is_visible()
    presidential.get_by_role("button", name="Confirmar candidatura").click()
    for _ in range(4):
        for action in ["Visitar comités del partido", "Convocar a la militancia"]:
            option = presidential.get_by_role("button", name=action)
            if option.is_disabled():
                presidential.get_by_role("button", name="Recaudar fondos").click()
            else:
                option.click()
        presidential.get_by_role("button", name="Siguiente semana").click()
    assert presidential.get_by_text("LIDERAZGO PARTIDARIO GANADO").is_visible()
    presidential.get_by_role("button", name="Iniciar mandato").click()
    assert presidential.get_by_text("LIDERAZGO PARTIDARIO", exact=True).count() > 0
    presidential.get_by_role("button", name="Unificar facciones").click()
    assert presidential.get_by_text("Decisiones anteriores").is_visible()
    for _ in range(8):
        presidential.get_by_role("button", name="Avanzar trimestre").click()
        presidential.wait_for_function("document.querySelector(\"main.app-shell\").getAttribute(\"aria-busy\") === \"false\"")
    assert presidential.get_by_text("MANDATO CERRADO").is_visible()
    senator = browser.new_page()
    senator.on("pageerror", lambda error: errors.append(str(error)))
    senator.goto("http://127.0.0.1:5173/?country=peru", wait_until="networkidle")
    senator.locator('input[type="checkbox"]').check()
    senator.get_by_label("Nombre público").fill("Rosa Medina")
    senator.get_by_label("Cargo inicial").select_option("senator")
    senator.get_by_label("Circunscripción").select_option("lima-metropolitana")
    senator.get_by_label("Semilla de la partida").fill("phase2-senate-smoke")
    next_step(senator)
    for _ in range(4):
        next_step(senator)
    assert senator.get_by_text("La edad mínima para Senado es 45 años.").is_visible()
    senator.get_by_label("Edad").fill("45")
    senator.get_by_role("button", name="Empezar campaña").click()
    senator.get_by_role("button", name="Confirmar nominación").click()
    for _ in range(4):
        for action in ["Recorrer el distrito", "Organizar un mitin"]:
            senator.get_by_role("button", name=action).click()
        senator.get_by_role("button", name="Siguiente semana").click()
    assert senator.get_by_text("ESCAÑO GANADO").is_visible()
    senator.get_by_role("button", name="Iniciar mandato").click()
    assert senator.get_by_text("60", exact=True).is_visible()
    assert senator.get_by_text("Sesión 0 de 20").is_visible()
    assert senator.get_by_text("IRONMAN · guardado único", exact=True).is_visible()
    assert senator.get_by_text("Importar partida", exact=True).count() == 0
    party_test = browser.new_page()
    party_test.on("pageerror", lambda error: errors.append(str(error)))
    party_test.goto("http://127.0.0.1:5173/?country=peru", wait_until="networkidle")
    party_test.get_by_label("Nombre público").fill("María Vega")
    party_test.get_by_label("Cargo inicial").select_option("president")
    party_test.get_by_label("Semilla de la partida").fill("phase2-president-smoke")
    next_step(party_test)
    for _ in range(4):
        next_step(party_test)
    party_test.get_by_label("Edad").fill("40")
    party_test.get_by_role("button", name="Empezar campaña").click()
    party_test.get_by_role("button", name="Confirmar nominación").click()
    for _ in range(4):
        for action in ["Recorrer el distrito", "Organizar un mitin"]:
            party_test.get_by_role("button", name=action).click()
        party_test.get_by_role("button", name="Siguiente semana").click()
    party_test.get_by_role("button", name="Iniciar mandato").click()
    for _ in range(20):
        party_test.get_by_role("button", name="Avanzar trimestre").click()
        party_test.wait_for_function("document.querySelector(\"main.app-shell\").getAttribute(\"aria-busy\") === \"false\"")
    assert party_test.get_by_text("MANDATO CERRADO").is_visible()
    other_party = party_test.get_by_label("Afiliarte a otro partido")
    other_party.select_option(index=1)
    switched_party_name = other_party.locator("option:checked").inner_text()
    party_test.get_by_role("button", name="Cambiar de partido").click()
    assert party_test.get_by_role("heading", name=switched_party_name).count() > 0
    party_test.get_by_label("Nombre del nuevo partido").fill("Marcha Abierta")
    party_test.get_by_role("button", name="Fundar partido", exact=True).click()
    assert party_test.get_by_role("heading", name="Marcha Abierta").count() > 0
    party_test.get_by_role("button", name="Retirarme y generar mi legado").click()
    assert party_test.get_by_text("LEGADO ·", exact=False).is_visible()
    party_test.get_by_role("button", name="Salón de la fama").click()
    party_test.locator(".hall-dialog article").first.wait_for()
    assert party_test.evaluate("document.querySelector('.hall-dialog').contains(document.activeElement)")
    party_test.keyboard.press("Escape")
    assert not party_test.locator(".hall-dialog").count()
    party_test.get_by_label("Nombre del partido para volver").fill("Nueva Ruta")
    party_test.get_by_role("button", name="Fundar partido y volver como agente libre").click()
    assert party_test.get_by_text("Semana 1 de 4").is_visible()
    france = browser.new_page()
    france.on("pageerror", lambda error: errors.append(str(error)))
    france.goto("http://127.0.0.1:5173/?country=france", wait_until="networkidle")
    assert france.get_by_label("País de inicio").input_value() == "france"
    france.get_by_label("Nombre público").fill("Lucía Martin")
    france.get_by_label("Cargo inicial").select_option("prime-minister")
    france.get_by_label("Semilla de la partida").fill("phase3-france-smoke")
    next_step(france)
    for _ in range(4):
        next_step(france)
    france.get_by_label("Edad").fill("40")
    france.get_by_role("button", name="Empezar campaña").click()
    france.get_by_role("button", name="05 Economía").click()
    france.get_by_role("heading", name="Empleo, precios y bienestar").wait_for()
    france.get_by_text("Ver sectores y grupos de la sociedad", exact=True).click()
    assert france.get_by_text("Extractivo", exact=False).count() >= 1
    assert france.locator(".country-facts details summary").count() == 20
    assert not errors, errors
    browser.close()
