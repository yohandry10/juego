from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'design/etapa-b/capturas'
OUT.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for width in [1440,900,390]:
        context=browser.new_context(viewport={'width':width,'height':960},reduced_motion='reduce')
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto('http://127.0.0.1:5173/?country=peru',wait_until='networkidle')
        def capture(name):
            page.evaluate('window.scrollTo(0,0)')
            page.evaluate('async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); }')
            page.screenshot(path=str(OUT/f'{name}-{width}.png'),full_page=name=='retratos')
            results.append({'screen':name,'width':width,'nativeSelects':page.locator('select').count(),'overflow':page.evaluate('document.documentElement.scrollWidth>innerWidth+2'),'headings':page.locator('h1,h2,h3').all_text_contents()[:8]})
        capture('inicio-mapa')
        page.get_by_role('button',name='Elegir mi cargo').click()
        capture('tarjetas-cargo')
        page.get_by_role('button',name='Entrar al juego').click()
        page.get_by_role('heading',name='El despacho',exact=True).wait_for()
        page.wait_for_load_state('networkidle')
        capture('despacho')
        page.get_by_role('button',name='Organizar mi campaña').click()
        page.get_by_role('button',name='Recorrer el distrito',exact=False).click()
        capture('campana')
        page.get_by_role('button',name='MANDATO · Volver al despacho',exact=True).click()
        page.get_by_role('button',name='La carpeta: Decisiones pendientes',exact=False).click()
        page.locator('.decision-letter').wait_for()
        capture('carta-decision')
        page.get_by_role('button',name='MANDATO · Volver al despacho',exact=True).click()
        page.get_by_role('button',name='El periódico: Lo que dice la prensa',exact=False).click()
        page.get_by_role('heading',name='La República de Papel',exact=True).wait_for()
        capture('prensa')
        page.get_by_role('button',name='MANDATO · Volver al despacho',exact=True).click()
        page.get_by_role('button',name='El Congreso: Los votos que necesitas',exact=False).click()
        page.locator('.hemicycle').wait_for()
        capture('congreso')
        page.goto('http://127.0.0.1:5173/ui-kit?country=peru',wait_until='networkidle')
        capture('ui-kit')
        page.get_by_role('button',name='Retratos',exact=True).click()
        capture('retratos')
        page.get_by_role('button',name='Atmósferas',exact=True).click()
        for label,name in [('Día','despacho-dia'),('Noche','despacho-noche'),('Crisis','despacho-crisis')]:
            page.get_by_role('button',name=label,exact=True).click()
            capture(name)
        assert not errors,errors
        context.close()
    browser.close()
(OUT.parent/'verificacion-ui.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(results,ensure_ascii=False,indent=2))
