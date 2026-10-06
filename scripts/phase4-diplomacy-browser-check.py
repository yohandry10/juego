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
    page.get_by_role("button", name="Reconocer interlocución").click()
    assert page.get_by_text("aislamiento diplomático: 6", exact=False).is_visible()
    page.get_by_role("button", name="Ofrecer ayuda exterior").click()
    assert page.get_by_text("Ayuda exterior acumulada: índice 5", exact=False).is_visible()
    page.get_by_role("button", name="Proponer acuerdo migratorio").click()
    assert page.get_by_text("Acuerdo de movilidad con", exact=False).is_visible()
    page.get_by_role("button", name="Solicitar programa IMF").click()
    assert page.get_by_text("Programa financiero con IMF", exact=False).is_visible()

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
    page.get_by_role("button", name="Someter a votación").first.click()
    assert page.get_by_text("a favor", exact=False).is_visible()
    assert (
        page.get_by_text("acuerdo migratorio ratificado: sí", exact=False).is_visible()
        or page.get_by_text("acuerdo migratorio ratificado: no", exact=False).is_visible()
    )
    finance_proposal = page.locator(".vote-report").filter(has_text="Programa financiero con IMF")
    finance_proposal.get_by_role("button", name="Someter a votación").click()
    assert page.get_by_text("Votación nominal ficticia en Perú", exact=False).count() >= 1
    assert not errors, errors
    print("OK: postura con costo, reconocimiento, ayuda exterior, tratado migratorio, elección y votación nominal de ratificación.")
    browser.close()
