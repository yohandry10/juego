"""Evidence for a design review, not a human usability test or game regression."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent
out = root / 'capturas-actuales'
out.mkdir(exist_ok=True)
fixture_path = Path(os.environ['TEMP']) / 'mandato-long-pc-state.json'
results = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width in [1440, 900]:
        context = browser.new_context(viewport={'width': width, 'height': 960})
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto('http://127.0.0.1:4173/?country=peru', wait_until='networkidle')
        page.get_by_role('button', name='Jugar ahora').wait_for()

        def capture(name):
            page.evaluate('window.scrollTo(0, 0)')
            page.screenshot(path=str(out / f'{name}-{width}.png'), full_page=False)
            results.append({'screen': name, 'width': width, 'height': 960,
                'nativeSelects': page.locator('select:visible').count(),
                'images': page.locator('img:visible').count(),
                'visibleButtons': page.locator('button:visible').count(),
                'overflow': page.evaluate('document.documentElement.scrollWidth > innerWidth + 2'),
                'headings': page.locator('h1,h2,h3').all_text_contents()[:12]})

        capture('inicio')
        page.get_by_label('Semilla de la partida').fill('stage-a-visual-review')
        page.get_by_role('button', name='Jugar ahora').click()
        page.get_by_role('heading', name='Elige una acción').wait_for()
        capture('campana-y-ficha')
        # Existing real forty-year save, unmodified, imported through the public UI.
        page.locator('input[type=file]').set_input_files(str(fixture_path))
        page.get_by_role('heading', name='Resumen de carrera', exact=True).wait_for()
        for name, accessible_name in [('bandeja', '02 Bandeja'), ('congreso', '03 Congreso'),
                                      ('prensa', '04 Prensa'), ('mundo', '06 Mundo')]:
            page.get_by_role('button', name=accessible_name, exact=True).click()
            page.wait_for_load_state('networkidle')
            if name == 'bandeja':
                page.locator('.inbox-grid > article').first.wait_for()
            if name == 'mundo':
                page.locator('svg').first.wait_for()
            capture(name)
        assert not errors, errors
        context.close()
    browser.close()

(root / 'evidencia-ui-actual.json').write_text(json.dumps({
    'date': '2026-10-06', 'baseCommit': 'e60e789',
    'method': 'Automated local screenshots plus expert five-second heuristic. No human sessions performed.',
    'fixture': 'Existing unmodified forty-year save for inbox, congress, press and world. Initial campaign uses a fresh save.',
    'results': results, 'pageErrors': []}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Captured twelve local screenshots; game saves and engine sources preserved.')
