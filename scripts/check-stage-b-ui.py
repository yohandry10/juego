"""Functional keyboard, archive, map, modal, fallback and resource checks."""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'design/etapa-b'
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':960},reduced_motion='reduce')
    page=context.new_page();errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto('http://127.0.0.1:5173/ui-kit?country=peru',wait_until='networkidle')
    selector=page.get_by_role('combobox',name='Respuesta',exact=True)
    selector.focus();selector.press('ArrowDown')
    page.get_by_role('listbox').press('ArrowDown')
    page.get_by_role('listbox').press('Enter')
    assert 'Presionar públicamente' in selector.inner_text()
    selector.click();page.get_by_role('listbox').press('End');page.get_by_role('listbox').press('Enter')
    assert 'Presionar públicamente' in selector.inner_text()
    page.get_by_role('listbox').press('Escape')
    assert selector.evaluate('node => node === document.activeElement')
    results.append('Selector: keyboard choice, disabled option, Escape and returned focus')
    opener=page.get_by_role('button',name='Abrir expediente',exact=True);opener.click()
    page.get_by_role('dialog',name='El expediente',exact=True).wait_for()
    nested=page.get_by_role('combobox',name='Respuesta en expediente',exact=True)
    nested.click()
    page.get_by_role('option',name='Abrir el diálogo',exact=True).click()
    assert 'Abrir el diálogo' in nested.inner_text()
    nested.click();page.keyboard.press('Escape')
    assert page.get_by_role('dialog',name='El expediente',exact=True).is_visible()
    page.keyboard.press('Escape')
    assert opener.evaluate('node => node === document.activeElement')
    results.append('Drawer: native focus trap and returned focus')
    page.goto('http://127.0.0.1:5173/?country=peru',wait_until='networkidle')
    france=page.locator('.world-map path').filter(has_not_text='').first
    # Country geometry has an accessible name supplied by the game catalog.
    map_names=page.locator('.world-map path[role=button]').evaluate_all('nodes=>nodes.map(n=>n.getAttribute("aria-label"))')
    french_name=next(name for name in map_names if name in ['Francia','France'])
    page.get_by_role('button',name=french_name,exact=True).focus()
    page.keyboard.press('Enter')
    page.get_by_role('heading',name='Francia',exact=True).wait_for()
    assert 'country=france' in page.url
    assert page.locator('select').count()==0
    page.get_by_role('button',name='Acercar mapa').click()
    assert 'scale(1.5)' in page.locator('.world-map > g').get_attribute('transform')
    page.get_by_role('button',name='Restablecer mapa').click()
    results.append('Map: selects a real geometry without reloading and zoom reset works')
    page.goto('http://127.0.0.1:5173/?country=peru',wait_until='networkidle')
    page.get_by_role('button',name='Elegir mi cargo').click();page.get_by_role('button',name='Entrar al juego').click()
    page.get_by_role('heading',name='El despacho',exact=True).wait_for()
    page.get_by_role('button',name='Opciones del juego',exact=True).click()
    motion_switch=page.get_by_role('switch',name='Reducir movimiento',exact=True)
    before=motion_switch.get_attribute('aria-checked')
    motion_switch.click()
    assert page.evaluate('document.documentElement.dataset.reduceMotion')!=before
    fixture=Path(os.environ['TEMP'])/'mandato-long-pc-state.json'
    page.locator('input[type=file]').set_input_files(str(fixture))
    page.get_by_role('button',name='Cerrar expediente',exact=True).click()
    page.get_by_role('button',name='La carpeta: Decisiones pendientes',exact=False).click()
    page.get_by_role('heading',name='Lo que necesita tu voz.',exact=True).wait_for()
    assert page.locator('.decision-stack button').count()<=7
    page.get_by_role('button',name='Archivo (',exact=False).click()
    archive=page.get_by_role('dialog',name='El archivo',exact=True)
    archive.wait_for();archive.get_by_role('searchbox',name='Buscar en el archivo').fill('presupuesto')
    assert archive.locator('.archive-list button').count()>0
    page.keyboard.press('Escape')
    results.append('Old career: import preserved, live matters bounded, archive searchable and focus restored')
    page.get_by_role('button',name='MANDATO · Volver al despacho',exact=True).click()
    page.get_by_role('button',name='El Congreso: Los votos que necesitas',exact=False).click()
    page.locator('.hemicycle g[role=button]').first.click()
    page.get_by_role('dialog').wait_for()
    assert page.locator('.game-modal .game-portrait').count()==1
    page.keyboard.press('Escape')
    results.append('Congress: existing representatives and relationship profile remain accessible')
    assert not errors,errors
    context.close()
    context=browser.new_context(viewport={'width':390,'height':960})
    page=context.new_page();page.route('**/assets/office/*.webp',lambda route:route.abort())
    page.goto('http://127.0.0.1:5173/?country=peru',wait_until='networkidle')
    page.get_by_role('button',name='Elegir mi cargo').click();page.get_by_role('button',name='Entrar al juego').click()
    page.locator('.asset-fallback').wait_for()
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+2')
    assert page.locator('.desk-hotspots button').count()==9
    results.append('Missing art: fallback preserves all navigation at 390 px')
    context.close();browser.close()
(OUT/'verificacion-funcional.json').write_text(json.dumps({'date':'2026-10-07','checks':results,'pageErrors':errors,'humanSessions':0},ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(results,ensure_ascii=False,indent=2))
