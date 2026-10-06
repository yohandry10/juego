from playwright.sync_api import sync_playwright


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto("http://127.0.0.1:5173", wait_until="networkidle")

    page.get_by_label("Nombre público").fill("Lucía Salas")
    page.get_by_label("Semilla de la partida").fill("phase1-browser-smoke")
    for _ in range(5):
        page.get_by_role("button", name="Siguiente paso").click()
    page.get_by_role("button", name="Empezar campaña").click()
    page.locator(".tabbar").get_by_role("button", name="Mundo").click()

    page.get_by_role("button", name="Alinearse").click()
    assert page.get_by_text("Tu línea: Alineamiento · influencia 47", exact=False).is_visible()
    assert page.get_by_role("button", name="Alinearse").is_disabled()
    page.get_by_role("button", name="Equilibrar").click()
    assert page.get_by_text("Tu línea: Equilibrio · influencia 45", exact=False).is_visible()
    page.get_by_role("button", name="Mantener neutralidad").click()
    assert page.get_by_text("Tu línea: Neutralidad · influencia 45", exact=False).is_visible()
    assert page.get_by_role("button", name="Abrir relaciones oficiales").is_disabled()
    assert page.get_by_role("button", name="Ofrecer ayuda exterior").is_disabled()
    page.get_by_role("button", name="Proponer acuerdo migratorio").click()
    assert page.get_by_text("Acuerdo de movilidad con", exact=False).is_visible()
    page.get_by_role("button", name="Solicitar apoyo del FMI").click()
    assert page.get_by_text("Solicitud pendiente de votación", exact=True).is_visible()

    page.locator(".tabbar").get_by_role("button", name="Resumen").click()
    page.get_by_role("button", name="Confirmar nominación").click()
    for week in range(4):
        for action in ["Recorrer el distrito", "Organizar un mitin"]:
            page.get_by_role("button", name=action).click()
        page.get_by_role("button", name="Siguiente semana").click()
    page.get_by_text("ESCAÑO GANADO").wait_for()
    page.get_by_role("button", name="Iniciar mandato").click()
    page.get_by_text("Sesión 0 de 20").wait_for()
    page.locator(".tabbar").get_by_role("button", name="Mundo").click()
    page.locator(".vote-report").filter(has_text="Acuerdo de movilidad con").get_by_role("button", name="Someter a votación").click()
    assert page.get_by_text("a favor", exact=False).is_visible()
    page.get_by_text("Ver compromisos y cifras exteriores", exact=True).click()
    assert (
        page.get_by_text("acuerdo migratorio ratificado: sí", exact=False).is_visible()
        or page.get_by_text("acuerdo migratorio ratificado: no", exact=False).is_visible()
    )
    finance_proposal = page.get_by_role("article", name="Apoyo del FMI", exact=True)
    finance_proposal.get_by_role("button", name="Someter a votación").click()
    assert page.get_by_text("Votación nominal ficticia en Perú", exact=False).count() >= 1
    executive = browser.new_page()
    executive.on("pageerror", lambda error: errors.append(str(error)))
    executive.goto("http://127.0.0.1:5173/?country=peru", wait_until="networkidle")
    executive.get_by_label("Nombre público").fill("Elena Cruz")
    executive.get_by_label("Cargo inicial").select_option("president")
    executive.get_by_label("Semilla de la partida").fill("phase2-president-smoke")
    for _ in range(5): executive.get_by_role("button", name="Siguiente paso").click()
    executive.get_by_label("Edad").fill("40")
    executive.get_by_role("button", name="Empezar campaña").click()
    executive.get_by_role("button", name="Confirmar nominación").click()
    for _ in range(4):
        executive.get_by_role("button", name="Recorrer el distrito").click()
        executive.get_by_role("button", name="Organizar un mitin").click()
        executive.get_by_role("button", name="Siguiente semana").click()
    executive.get_by_role("button", name="Iniciar mandato").click()
    executive.get_by_role("button", name="06 Mundo").click()
    executive.get_by_role("button", name="Abrir relaciones oficiales").click()
    executive.get_by_role("button", name="Ofrecer ayuda exterior").click()
    executive.get_by_text("Ver compromisos y cifras exteriores", exact=True).click()
    assert executive.get_by_text("Ayuda exterior acumulada: índice 5", exact=False).is_visible()
    executive.get_by_role("button", name="Proponer tratado comercial").click()
    executive.get_by_role("button", name="Someter a votación").click()
    assert executive.get_by_text("Votación nominal ficticia en Perú", exact=False).count() >= 1
    assert not errors, errors
    print("OK: permisos por cargo, postura con costo, reconocimiento/ayuda ejecutivos, tratados y ratificación parlamentaria y ejecutiva.")
    browser.close()
