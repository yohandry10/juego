"""Player journeys through public UI only; isolated browser saves and evidence."""
import ast,json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / os.environ.get('MANDATO_QA_OUTPUT', 'docs/qa-player/2026-10-07')
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('MANDATO_BASE_URL', 'http://127.0.0.1:5174')
ENGINE = os.environ.get('MANDATO_QA_ENGINE', 'chromium')
WIDTH = int(os.environ.get('MANDATO_QA_WIDTH', '1920'))
HEIGHT = int(os.environ.get('MANDATO_QA_HEIGHT', '1080'))
OUT = OUT / f'{ENGINE}-{WIDTH}'
OUT.mkdir(parents=True, exist_ok=True)
results = []
contrasts = []
audit = next(ast.literal_eval(n.value) for n in ast.parse((ROOT/'scripts/contrast-browser-check.py').read_text()).body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='audit' for t in n.targets))

def settle(page):
    page.wait_for_load_state('networkidle')
    page.evaluate('document.fonts.ready')
    for img in page.locator('img:visible').all():
        img.evaluate('img => img.decode().catch(() => {})')
    page.evaluate("Promise.all(document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))")

def capture(page, name):
    settle(page)
    page.screenshot(path=str(OUT / f'{name}.png'))
    contrast = page.evaluate(audit)
    contrasts.append(dict(view=name, **contrast))
    assert not contrast['failures'], (name, contrast['failures'])

def start(page, country='peru', office=None):
    page.goto(f'{BASE}/?country={country}', wait_until='networkidle')
    page.get_by_role('button', name='Elegir mi cargo', exact=False).click()
    if office:
        page.get_by_role('button', name=office, exact=False).click()
    page.get_by_role('button', name='Entrar al juego', exact=False).click()
    page.locator('.cinematic-desk').wait_for()
    settle(page)

def export(page):
    page.get_by_role('button', name='Opciones del juego', exact=True).click()
    with page.expect_download() as download:
        page.get_by_role('button', name='Exportar partida', exact=True).click()
    value = json.loads(Path(download.value.path()).read_text(encoding='utf-8'))
    page.keyboard.press('Escape')
    return value

def close_encounter(page):
    page.get_by_role('button', name='Cerrar conversación y volver al despacho', exact=True).click()
    page.locator('.office-encounter').wait_for(state='detached')

def action(page, name):
    page.get_by_role('button', name='Organizar campaña', exact=False).click()
    if name in ['Recaudar fondos', 'Organizar un mitin', 'Dar una entrevista', 'Hacer una promesa']:
        page.get_by_text('Otras acciones de campaña', exact=True).click()
    page.locator('.office-encounter').get_by_role('button', name=name, exact=False).click()
    page.get_by_role('dialog', name='Consecuencias de tu decisión').wait_for()
    close_encounter(page)

def navigation(page):
    start(page)
    visited = []
    for zone, expected in [('El periódico:', '.press-scene'), ('Mesa de mapas:', '.world-panel'),
                            ('La ventana:', '.economy-panel'), ('El Congreso:', '.congress-scene'),
                            ('Tu silla:', '.career-scene')]:
        page.get_by_role('button', name=zone, exact=False).click()
        page.locator(expected).wait_for()
        settle(page)
        text = page.locator('body').inner_text()
        capture(page, 'nav-' + zone.split(':')[0].replace(' ', '-'))
        assert len(text) > 250
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2')
        visited.append({'zone': zone, 'text': text[:500]})
        page.get_by_role('button', name='MANDATO · Volver al despacho', exact=True).click()
    page.get_by_role('button', name='Opciones del juego', exact=True).click()
    page.get_by_role('button', name='Ayuda y accesibilidad', exact=True).click()
    page.get_by_role('button', name='Muy grande', exact=True).click()
    assert page.evaluate("document.documentElement.dataset.textSize") == 'largest'
    page.get_by_label('Buscar un término').fill('xxxxxxxxxx')
    assert page.get_by_text('No hay términos que coincidan con esa búsqueda.').is_visible()
    page.get_by_role('button', name='MANDATO · Volver al despacho', exact=True).click()
    page.get_by_role('button', name='Teléfono:', exact=False).click()
    capture(page, 'text-largest-conversation')
    assert page.get_by_role('button', name='Cerrar conversación y volver al despacho').is_visible()
    page.keyboard.press('Escape')
    page.reload(wait_until='networkidle')
    assert page.evaluate("document.documentElement.dataset.textSize") == 'largest'
    return {'visited': visited, 'textPreferencePersisted': True}

def country_resume(page):
    start(page, 'mexico')
    before = export(page)
    assert before['countryId'] == 'mexico'
    page.goto(BASE+'/', wait_until='networkidle')
    capture(page, 'resume-mexico-from-root')
    assert page.locator('.cinematic-desk').count() == 1, 'La raíz no restaura la carrera guardada de México'
    assert 'México' in page.locator('.hud-date').inner_text(), 'El guardado usa el país equivocado'
    after = export(page)
    assert after['seed'] == before['seed'] and after['countryId'] == 'mexico'
    return {'country': after['countryId'], 'sameSeed': True}

def explicit_new_country(page):
    start(page, 'mexico', 'Presidente')
    saved = export(page)
    assert saved['campaign']['officeId'] == 'president'
    start(page, 'germany')
    new = export(page)
    assert new['countryId'] == 'germany' and new['seed'] != saved['seed']
    assert not page.get_by_role('alert').count()
    return {'previous': saved['countryId'], 'new': new['countryId'], 'foreignSetupCleared': True}

def generated_resume(page):
    start(page, 'generated-abw')
    saved = export(page)
    page.goto(BASE+'/', wait_until='networkidle')
    page.locator('.cinematic-desk').wait_for()
    after = export(page)
    assert after['countryId'] == 'generated-abw' and after['seed'] == saved['seed']
    return {'generatedSaveRestored': True}

def invalid_import(page):
    start(page)
    before = export(page)
    invalid = OUT / 'invalid-qa.json'
    invalid.write_text('{"broken":true}', encoding='utf-8')
    page.get_by_role('button', name='Opciones del juego', exact=True).click()
    page.locator('input[type=file]').set_input_files(str(invalid))
    page.get_by_role('dialog', name='Opciones del juego').wait_for(state='detached')
    assert 'No se pudo importar' in page.get_by_role('alert').inner_text()
    capture(page, 'invalid-import')
    after = export(page)
    assert after == before, 'Una importación inválida cambió la carrera'
    page.reload(wait_until='networkidle')
    assert export(page) == before
    return {'rejected': True, 'originalPreserved': True}

def custom_character(page):
    page.goto(BASE+'/?country=peru', wait_until='networkidle')
    page.get_by_role('button', name='Elegir mi cargo', exact=False).click()
    page.get_by_role('button', name='Senado', exact=False).click()
    page.get_by_role('button', name='Escribir mi biografía', exact=True).click()
    for step in range(1,6):
        capture(page, f'biography-chapter-{step}')
        page.get_by_role('button', name='Siguiente paso', exact=False).click()
        assert page.locator('.biography-story h1').evaluate('el=>document.activeElement===el')
    capture(page,'biography-chapter-6')
    page.get_by_label('Nombre público').fill('Lucía Salazar QA')
    page.get_by_text('Semilla, realismo y modo de partida', exact=True).click()
    page.get_by_label('Semilla de la partida').fill('player-qa-2026-senate')
    page.get_by_label('Ironman', exact=False).check()
    page.get_by_label('Edad', exact=True).fill('20')
    page.get_by_role('button', name='Empezar campaña', exact=False).click()
    assert page.locator('.creation-card').count() == 1, 'Permite iniciar Senado con edad inválida'
    page.get_by_label('Edad', exact=True).fill('45')
    ranges = page.locator('.attribute-list input[type=range]')
    ranges.first.fill('20')
    values = [int(v) for v in ranges.evaluate_all('els=>els.map(e=>e.value)')]
    assert sum(values) == 70 and all(1 <= v <= 20 for v in values)
    page.get_by_role('button', name='Empezar campaña', exact=False).click()
    page.locator('.cinematic-desk').wait_for()
    saved = export(page)
    assert saved['player']['name'] == 'Lucía Salazar QA' and saved['player']['age'] == 45
    assert saved['campaign']['officeId'] == 'senator' and saved['ironman']
    page.get_by_role('button', name='Opciones del juego', exact=True).click()
    assert page.locator('input[type=file]').count() == 0
    page.once('dialog', lambda dialog: dialog.dismiss())
    page.get_by_role('button', name='Nueva carrera', exact=True).click()
    assert page.locator('.cinematic-desk').count() == 1
    page.keyboard.press('Escape')
    page.reload(wait_until='networkidle')
    assert export(page) == saved
    capture(page, 'custom-senate-ironman')
    return {'sixSteps': True, 'ageValidation': True, 'attributePool': 70, 'ironmanImportBlocked': True, 'newCareerCancelPreserved': True}

def map_country_selector(page):
    page.goto(BASE+'/', wait_until='networkidle')
    page.get_by_text('Buscar un país', exact=True).click()
    selector = page.get_by_role('combobox', name='Todos los países', exact=True)
    selector.click()
    page.get_by_role('searchbox', name='Buscar Todos los países', exact=True).fill('México')
    page.get_by_role('option', name='México', exact=True).click()
    page.get_by_role('heading', name='México', exact=True).wait_for()
    assert 'country=mexico' in page.url
    selector.click()
    page.keyboard.press('End')
    focused = page.locator('.selector-panel .focused')
    visible = focused.evaluate("el => {const e=el.getBoundingClientRect(),p=el.closest('.selector-panel').getBoundingClientRect();return e.top>=p.top && e.bottom<=p.bottom}")
    capture(page, 'country-selector-keyboard-end')
    assert visible, 'El teclado cambia la opción activa sin desplazar la lista: opción fuera de la pantalla'
    page.keyboard.press('Escape')
    page.get_by_role('button', name='Acercar mapa').click()
    assert page.get_by_role('button', name='Alejar mapa').is_enabled()
    page.get_by_role('button', name='Restablecer mapa').click()
    assert page.get_by_role('button', name='Alejar mapa').is_disabled()
    return {'countrySearch': True, 'keyboardOptionVisible': True, 'zoomReset': True}

def diplomacy_and_archive(page):
    start(page)
    action(page, 'Recorrer el distrito')
    page.get_by_role('button', name='Teléfono:', exact=False).click()
    page.get_by_role('button', name='Responder públicamente', exact=False).click()
    page.get_by_role('dialog', name='Consecuencias de tu decisión').wait_for()
    close_encounter(page)
    before = export(page)
    page.get_by_role('button', name='Mesa de mapas:', exact=False).click()
    page.locator('.world-panel').wait_for()
    page.get_by_text('Relaciones, acuerdos y decisiones con', exact=False).click()
    page.get_by_role('combobox', name='Acción diplomática', exact=True).click()
    page.get_by_role('option', name='Imponer sanción', exact=True).click()
    assert page.get_by_role('button', name='Imponer sanción', exact=True).is_disabled()
    page.get_by_role('combobox', name='Acción diplomática', exact=True).click()
    page.get_by_role('option', name='Realizar visita', exact=True).click()
    names = page.locator('.world-dossier .decision-card button').all_text_contents()
    visit = page.get_by_role('button', name='Realizar visita', exact=True)
    assert visit.is_enabled()
    visit.click()
    after = export(page)
    assert after['geopolitics']['player']['influence'] < before['geopolitics']['player']['influence']
    assert after['geopolitics']['actions'][-1]['targetId'] == 'usa'
    page.get_by_role('button', name='MANDATO · Volver al despacho', exact=True).click()
    page.get_by_role('button', name='Teléfono:', exact=False).click()
    page.get_by_role('button', name='Consultar el archivo', exact=True).click()
    page.get_by_role('button', name='Archivo (', exact=False).click()
    page.get_by_role('searchbox', name='Buscar en el archivo').fill('Asamblea')
    resolved = page.locator('.archive-list button').filter(has_text='Asamblea').first
    resolved.click()
    assert page.get_by_text('Respuesta registrada. Consulta las consecuencias en el diario.', exact=True).is_visible()
    page.get_by_role('button', name='Diario', exact=True).click()
    page.get_by_role('textbox', name='Buscar en el diario').fill('Respondiste')
    assert 'Asamblea' in page.locator('.game-modal .log-list').inner_text()
    page.keyboard.press('Escape')
    return {'officialActionsBlockedAsCandidate': True, 'visitConsumesInfluence': True, 'resolvedArchiveReadable': True, 'diarySearch': True}

def cross_country_import(page):
    start(page, 'mexico')
    original = export(page)
    file = OUT / 'mexico-qa-export.json'
    file.write_text(json.dumps(original, ensure_ascii=False), encoding='utf-8')
    # A second browser context imports through the player's file input.
    other = page.context.browser.new_context(viewport={'width': WIDTH, 'height': HEIGHT})
    target = other.new_page()
    errors = []
    target.on('pageerror', lambda error: errors.append(str(error)))
    try:
        target.goto(BASE+'/?country=peru', wait_until='networkidle')
        target.get_by_role('button', name='Elegir mi cargo', exact=False).wait_for()
        target.get_by_role('button', name='Opciones del juego', exact=True).click()
        target.locator('input[type=file]').set_input_files(str(file))
        target.get_by_role('dialog', name='Opciones del juego').wait_for(state='detached')
        settle(target)
        capture(target, 'import-mexico-into-peru')
        assert 'México' in target.locator('.hud-date').inner_text(), 'Importa el estado mexicano pero conserva instituciones y HUD de Perú'
        saved = export(target)
        assert saved['countryId'] == 'mexico' and saved['seed'] == original['seed']
        target.reload(wait_until='networkidle')
        assert target.locator('.cinematic-desk').count() == 1
        assert 'México' in target.locator('.hud-date').inner_text()
        assert not errors, errors
        return {'crossCountry': True, 'reload': True}
    finally:
        other.close()

def campaign_election(page):
    start(page)
    initial = export(page)
    action(page, 'Recorrer el distrito')
    action(page, 'Hablar con el partido')
    exhausted = export(page)
    assert exhausted['campaign']['actionsRemaining'] == 0
    page.get_by_role('button', name='Organizar campaña', exact=False).click()
    assert page.get_by_role('button', name='01 Recorrer el distrito', exact=False).is_disabled()
    page.get_by_role('button', name='Pedir la nominación', exact=False).click()
    page.get_by_role('dialog', name='Consecuencias de tu decisión').wait_for()
    capture(page, 'nomination-result')
    close_encounter(page)
    nominated = export(page)
    assert nominated['campaign']['nominated']
    for week in range(2, 5):
        page.get_by_role('button', name='Siguiente semana', exact=False).click()
        action(page, 'Organizar un mitin')
        action(page, 'Recorrer el distrito')
        saved = export(page)
        assert saved['campaign']['week'] == week and saved['campaign']['actionsRemaining'] == 0
    page.get_by_role('button', name='Siguiente semana', exact=False).click()
    page.get_by_role('dialog', name='Las urnas ya hablaron.').wait_for()
    capture(page, 'election-ceremony')
    page.get_by_role('button', name='Leer el resultado', exact=False).click()
    outcome = export(page)
    assert outcome['stage'] == 'election-result'
    capture(page, 'election-result-before-view')
    assert page.locator('.career-scene--election-result').is_visible()
    capture(page, 'election-result-after-view')
    # Viewing an election must show it before consuming the transition.
    shown = export(page)
    assert shown['stage'] == 'election-result', 'Ver resultado salta la elección sin mostrarla y cambia la etapa'
    assert outcome['electionOutcome']['explanation'] in page.locator('body').inner_text()
    page.locator('.career-page').get_by_role('button', name='Continuar mi carrera', exact=False).click()
    transition = export(page)
    if outcome['electionOutcome']['elected']:
        assert transition['stage'] == 'legislature'
        page.get_by_role('button', name='MANDATO · Volver al despacho', exact=True).click()
        page.get_by_role('button', name='El Congreso:', exact=False).click()
        page.locator('.hemicycle [role=button]').first.click()
        profile = page.get_by_role('dialog')
        profile.wait_for()
        assert profile.locator('img').count() == 1
        negotiate = profile.get_by_role('button', name='Negociar', exact=False)
        if negotiate.is_enabled():
            capital = transition['player']['resources']['politicalCapital']
            negotiate.click()
            page.keyboard.press('Escape')
            assert export(page)['player']['resources']['politicalCapital'] == capital-5
        else:
            page.keyboard.press('Escape')
        vote = page.get_by_role('button', name='Votar a favor', exact=False)
        if vote.is_enabled():
            vote.click()
            page.get_by_role('button', name='Mostrar el acta completa', exact=True).click()
            capture(page, 'recorded-vote-ceremony')
            page.get_by_role('button', name='Volver al hemiciclo', exact=True).click()
            assert not page.get_by_role('button', name='Votar a favor', exact=False).count()
        page.get_by_role('button', name='MANDATO · Volver al despacho', exact=True).click()
        before_turn = export(page)
        page.get_by_role('button', name='Fin de turno', exact=False).click()
        page.wait_for_function("!document.querySelector('main[aria-busy=true]')")
        page.get_by_role('button', name='Abrir mi despacho', exact=False).click()
        after_turn = export(page)
        assert after_turn['currentTurn'] == before_turn['currentTurn']+1
        assert after_turn['geopolitics']['quarterIndex'] == before_turn['geopolitics']['quarterIndex']+1
        capture(page, 'after-legislative-turn')
    else:
        assert transition['stage'] == 'term-summary'
        page.get_by_role('button', name='Ver mis decisiones', exact=False).click()
        page.get_by_role('button', name='Retirarme y generar mi legado', exact=True).click()
        page.keyboard.press('Escape')
        retired = export(page)
        assert retired['stage'] == 'legacy' and retired['legacy']
        page.reload(wait_until='networkidle')
        assert export(page)['legacy'] == retired['legacy']
        capture(page, 'retired-saved')
    return {'campaignCompleted': True, 'elected': outcome['electionOutcome']['elected'], 'nextStage': transition['stage'],
            'initialFunds': initial['player']['resources']['campaignFunds'],
            'finalFunds': outcome['player']['resources']['campaignFunds']}

with sync_playwright() as p:
    browser = getattr(p, ENGINE).launch(headless=True)
    scenarios = [('navigation', navigation), ('country-resume', country_resume),
                 ('cross-country-import', cross_country_import), ('campaign-election', campaign_election),
                 ('explicit-new-country', explicit_new_country), ('generated-resume', generated_resume),
                 ('invalid-import', invalid_import), ('custom-character', custom_character),
                 ('map-country-selector', map_country_selector), ('diplomacy-archive', diplomacy_and_archive)]
    only = os.environ.get('MANDATO_QA_SCENARIOS', '').split(',')
    for name, fn in scenarios:
        if only != [''] and name not in only:
            continue
        context = browser.new_context(viewport={'width': WIDTH, 'height': HEIGHT}, accept_downloads=True)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda err: errors.append(str(err)))
        try:
            details = fn(page)
            assert not errors, errors
            results.append({'scenario': name, 'status': 'passed', 'details': details, 'errors': errors})
            print('PASS', name, flush=True)
        except Exception as error:
            results.append({'scenario': name, 'status': 'failed', 'error': str(error), 'errors': errors})
            print('FAIL', name, str(error)[:600], flush=True)
        finally:
            context.close()
    browser.close()
suffix = '-subset' if only != [''] else ''
(OUT / f'player-evidence{suffix}.json').write_text(json.dumps({'base': BASE, 'engine': ENGINE, 'viewport':[WIDTH,HEIGHT], 'results': results}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
(OUT / f'player-contrast{suffix}.json').write_text(json.dumps({'limitations':'Colores CSS opacos frente al fondo más próximo; excluye imágenes, SVG y lector de pantalla.','results':contrasts},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if not results or any(result['status'] != 'passed' for result in results):
    raise SystemExit(1)
