"""Production smoke: every curated country, real decisions and offline recovery."""
import json
import os
import subprocess
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / os.environ.get('MANDATO_QA_OUTPUT', 'docs/qa-player/2026-10-07') / 'production'
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('MANDATO_BASE_URL', 'http://127.0.0.1:4175').rstrip('/')
catalog = json.loads((ROOT / 'public/data/countries/index.json').read_text(encoding='utf-8'))['countries']
results = []

def export(page):
    page.get_by_role('button', name='Opciones del juego', exact=True).click()
    with page.expect_download() as download:
        page.get_by_role('button', name='Exportar partida', exact=True).click()
    saved = json.loads(Path(download.value.path()).read_text(encoding='utf-8'))
    page.keyboard.press('Escape')
    return saved

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for country in catalog:
        context = browser.new_context(viewport={'width':1920, 'height':1080}, accept_downloads=True)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        try:
            page.goto(f"{BASE}/?country={country['id']}", wait_until='networkidle')
            page.get_by_role('heading', name=country['name'], exact=True).wait_for()
            page.get_by_role('button', name='Elegir mi cargo', exact=False).click()
            page.get_by_role('button', name='Entrar al juego', exact=False).click()
            page.locator('.cinematic-desk').wait_for()
            before = export(page)
            assert before['countryId'] == country['id']
            page.get_by_role('button', name='Teléfono:', exact=False).click()
            portrait = page.locator('.encounter-person img')
            portrait.evaluate('img=>img.decode()')
            assert portrait.evaluate('img=>img.naturalWidth') == 512
            page.get_by_role('button', name='01 Recorrer el distrito', exact=False).click()
            page.get_by_role('dialog', name='Consecuencias de tu decisión').wait_for()
            page.get_by_role('button', name='Cerrar conversación y volver al despacho').click()
            after = export(page)
            assert after['campaign']['actionsRemaining'] == before['campaign']['actionsRemaining']-1
            assert after['player']['resources']['campaignFunds'] == before['player']['resources']['campaignFunds']-3
            page.goto(BASE+'/', wait_until='networkidle')
            page.locator('.cinematic-desk').wait_for()
            assert export(page) == after
            assert not errors, errors
            results.append({'country':country['id'], 'status':'passed', 'office':after['campaign']['officeId'],
                            'realDecision':True, 'portraitDecoded':True, 'exactSaveRestored':True, 'errors':errors})
            print('PASS production-country', country['id'], flush=True)
        except Exception as error:
            results.append({'country':country['id'], 'status':'failed', 'error':str(error), 'errors':errors})
            page.screenshot(path=str(OUT / f"failed-{country['id']}.png"))
            print('FAIL production-country', country['id'], str(error)[:300], flush=True)
        finally:
            context.close()
    browser.close()

(OUT / 'country-evidence.json').write_text(json.dumps({'base':BASE, 'results':results}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
if len(results) != 10 or any(result['status'] != 'passed' for result in results):
    raise SystemExit(1)

env = dict(os.environ, MANDATO_BASE_URL=BASE,
           MANDATO_QA_OFFLINE_EVIDENCE=str(OUT / 'offline-evidence.json'))
subprocess.run([sys.executable, str(ROOT / 'scripts/cinematic-offline-check.py')], env=env, check=True)
# Recheck the imported save at the actual smaller Firefox viewport in production.
env.update(MANDATO_QA_ENGINE='firefox', MANDATO_QA_WIDTH='1280', MANDATO_QA_HEIGHT='720',
           MANDATO_QA_SCENARIOS='cross-country-import')
subprocess.run([sys.executable, str(ROOT / 'scripts/player-qa.py')], env=env, check=True)
