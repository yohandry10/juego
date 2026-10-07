"""Full-role public UI QA. Fixtures are produced by real game commands."""
import ast,json,os,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('MANDATO_BASE_URL','http://127.0.0.1:5174').rstrip('/')
ENGINE=os.environ.get('MANDATO_QA_ENGINE','chromium')
WIDTH=int(os.environ.get('MANDATO_QA_WIDTH','1920'))
HEIGHT=int(os.environ.get('MANDATO_QA_HEIGHT','1080'))
OUT=ROOT/'design/completion/qa'/f'{ENGINE}-{WIDTH}'
OUT.mkdir(parents=True,exist_ok=True)
FIX=ROOT/'design/completion/fixtures'
audit=next(ast.literal_eval(n.value) for n in ast.parse((ROOT/'scripts/contrast-browser-check.py').read_text()).body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='audit' for t in n.targets))
results=[];contrasts=[]

def settle(page):
    page.wait_for_load_state('networkidle');page.evaluate('document.fonts.ready')
    page.evaluate("Promise.all([...document.images].filter(i=>i.getBoundingClientRect().width).map(i=>i.decode().catch(()=>{})))")

def capture(page,name,full=False):
    settle(page)
    page.screenshot(path=str(OUT/(name+'.png')),full_page=full)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),name
    contrast=page.evaluate(audit)
    contrasts.append(dict(view=name,**contrast))
    assert not contrast['failures'], (name,contrast['failures'])

def imported(page,name):
    page.goto(BASE+'/?country=peru',wait_until='networkidle')
    page.get_by_role('button',name='Opciones del juego',exact=True).click()
    page.locator('input[type=file]').set_input_files(str(FIX/(name+'.json')))
    page.get_by_role('dialog',name='Opciones del juego').wait_for(state='detached')
    page.locator('.cinematic-desk').wait_for()
    if page.get_by_role('status').filter(has_text='Partida importada.').count():page.get_by_role('button',name='Cerrar aviso',exact=True).click()

def export(page):
    page.get_by_role('button',name='Opciones del juego',exact=True).click()
    with page.expect_download() as event:page.get_by_role('button',name='Exportar partida',exact=True).click()
    value=json.loads(Path(event.value.path()).read_text(encoding='utf-8'));page.keyboard.press('Escape');return value

def career(page):
    page.get_by_role('button',name='Tu silla:',exact=False).click();page.locator('.career-scene').wait_for()

def desk(page):page.get_by_role('button',name='MANDATO · Volver al despacho',exact=True).click()

def legislation(page):
    imported(page,'legislature');page.get_by_role('button',name='El Congreso:',exact=False).click()
    page.locator('.hemicycle [role=button]').nth(1).click();page.get_by_role('dialog').wait_for()
    before=json.loads((FIX/'legislature.json').read_text())
    page.get_by_role('button',name='Negociar',exact=False).click();page.keyboard.press('Escape')
    after=export(page);assert after['player']['resources']['politicalCapital']==before['player']['resources']['politicalCapital']-5
    page.get_by_role('button',name='Votar a favor',exact=False).click()
    page.locator('.vote-ceremony').wait_for()
    if page.get_by_role('button',name='Mostrar el acta completa').count():page.get_by_role('button',name='Mostrar el acta completa').click()
    capture(page,'full-role-vote')
    displayed=page.locator('.vote-seats rect[data-legislator]').evaluate_all("nodes=>Object.fromEntries(nodes.map(node=>[node.dataset.legislator,node.dataset.ballot]))")
    page.get_by_role('button',name='Volver al hemiciclo').click()
    saved=export(page);vote=saved['legislature']['voteHistory'][-1]
    assert displayed=={ballot['legislatorId']:ballot['choice'] for ballot in vote['votes']}
    assert len(vote['votes'])==len([m for m in saved['world']['legislators'] if m['chamberId']==saved['legislature']['chamberId']])
    assert len(saved['legislature']['voteHistory'])==1
    page.reload(wait_until='networkidle');assert export(page)==saved
    return {'ballots':len(vote['votes']),'singleVote':True,'negotiationCostsFive':True,'saveExact':True}

def role(page,name,button,actionKey,cost):
    imported(page,name);career(page);before=export(page)
    page.get_by_role('button',name=button,exact=False).click()
    after=export(page);assert after['player']['resources']['politicalCapital']==before['player']['resources']['politicalCapital']-cost
    assert after[actionKey]['actionsRemaining']==before[actionKey]['actionsRemaining']-1
    capture(page,'full-role-'+name);page.reload(wait_until='networkidle');assert export(page)==after
    return {'stage':after['stage'],'cost':cost,'actionBudget':True,'saveExact':True}

def executive(page):
    imported(page,'executive');career(page);capture(page,'full-role-executive')
    page.get_by_role('button',name='Elegir una medida económica',exact=False).click();page.locator('.economy-scene').wait_for()
    capture(page,'full-role-government-economy')
    for name in ['Presentar al Congreso','Aplicar por decreto']:
        assert page.get_by_role('button',name=name,exact=True).evaluate('el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}'),name+' fuera del primer encuadre'
    before=export(page);decree=page.get_by_role('button',name='Aplicar por decreto',exact=False)
    assert decree.is_enabled();decree.click();after=export(page)
    assert len(after['world']['economy']['policyHistory'])>len(before['world']['economy']['policyHistory'])
    capture(page,'full-role-economy-after-decree');desk(page)
    page.get_by_role('button',name='Mesa de mapas:',exact=False).click();page.locator('.world-panel').wait_for()
    capture(page,'full-role-government-world')
    return {'executiveMeasure':True,'policies':len(after['world']['economy']['policyHistory'])}

def challenge(page):
    imported(page,'challenge');career(page)
    if page.get_by_role('button',name='Abrir el debate',exact=False).count():page.get_by_role('button',name='Abrir el debate',exact=False).click()
    if page.get_by_role('button',name='Defender al Gobierno',exact=False).count():
        before=export(page);page.get_by_role('button',name='Defender al Gobierno',exact=False).click();after=export(page)
        assert after['player']['resources']['politicalCapital']==before['player']['resources']['politicalCapital']-5
        if page.get_by_role('button',name='Cumplir el plazo de defensa',exact=False).count():page.get_by_role('button',name='Cumplir el plazo de defensa',exact=False).click()
        page.get_by_role('button',name='Celebrar la votación',exact=False).click()
    state=export(page);assert not state['government']['challenge'];capture(page,'full-role-challenge')
    return {'status':state['government']['status'],'constitutionalProcedureClosed':True}

def investiture(page):
    imported(page,'investiture');career(page);assert page.get_by_role('button',name='Votar la investidura').is_visible()
    page.get_by_text('Construir una mayoría · negociar apoyos',exact=True).click()
    buttons=page.get_by_role('button',name='Negociar con',exact=False)
    for _ in range(4):
        target=next((b for b in buttons.all() if b.is_enabled()),None)
        if not target:break
        target.click()
    page.get_by_role('button',name='Votar la investidura').click();state=export(page);capture(page,'full-role-investiture')
    assert state['government']['lastInvestitureYes'] is not None;return {'status':state['government']['status'],'actualAct':True}

def legacy(page):
    imported(page,'legacy');career(page);before=export(page)
    for years in [5,15,30]:
        page.get_by_role('button',name=str(years)+' años',exact=True).click();assert page.get_by_role('heading',name=f'Lectura proyectada a {years} años',exact=False).is_visible()
    assert export(page)==before
    capture(page,'full-role-legacy',True)
    with page.expect_download() as event:page.get_by_role('button',name='Descargar tarjeta de legado').click()
    event.value.save_as(str(OUT/'legacy-card.png'))
    page.get_by_role('button',name='Mi retiro y el siguiente capítulo',exact=False).click()
    page.get_by_role('button',name='Respaldar a',exact=False).first.click()
    after=export_without_nested(page);assert any(h['outcome']=='backed-successor' for h in after['careerHistory'])
    page.get_by_role('button',name='Mi retiro y el siguiente capítulo',exact=False).click();page.get_by_role('button',name='Aceptar el llamado',exact=True).click();page.keyboard.press('Escape')
    returned=export(page);assert returned['stage']=='campaign' and returned['lifeStatus']=='active'
    return {'historyProjectionsDoNotMutate':True,'pngDownloaded':True,'successorBacked':True,'returned':True}

def export_without_nested(page):
    page.keyboard.press('Escape');return export(page)

def long_memory(page):
    imported(page,'long-career');before=export(page);assert before['player']['age']==70
    page.get_by_role('button',name='Teléfono:',exact=False).click();page.get_by_role('button',name='Consultar el archivo').click()
    assert page.locator('.letter-pile button').count()<=7
    page.get_by_role('button',name='Archivo (',exact=False).click();page.get_by_role('searchbox',name='Buscar en el archivo').fill('Asamblea')
    assert page.locator('.archive-list button').count()>0
    capture(page,'full-role-forty-year-archive');page.keyboard.press('Escape');assert export(page)==before
    return {'age':70,'retainedLetters':len(before['inbox']),'visibleActiveMaximum':7,'archiveSearch':True}

def audio_motion(page):
    page.goto(BASE+'/',wait_until='networkidle');assert page.evaluate('window.__audioCreated||0')==0
    page.get_by_role('button',name='Opciones del juego',exact=True).click()
    sound=page.get_by_role('switch',name='Sonido y ambiente');assert sound.get_attribute('aria-checked')=='false';sound.click()
    page.get_by_role('slider',name='Volumen',exact=True).fill('0.4');page.keyboard.press('Tab')
    page.wait_for_function('window.__audioCreated===1');page.wait_for_function("window.__audioState.state==='running'")
    page.get_by_role('switch',name='Reducir movimiento').click();page.keyboard.press('Escape')
    assert page.evaluate('document.documentElement.dataset.reduceMotion')=='true'
    page.reload(wait_until='networkidle');assert page.evaluate('window.__audioCreated||0')==0
    page.get_by_role('button',name='Opciones del juego',exact=True).click()
    assert page.get_by_role('switch',name='Sonido y ambiente').get_attribute('aria-checked')=='true'
    assert page.get_by_role('slider',name='Volumen').input_value()=='0.4'
    page.get_by_role('switch',name='Sonido y ambiente').click()
    return {'noAutoplay':True,'contextStartedAfterInteraction':True,'soundAndVolumePersist':True,'reducedMotionPersists':True}

def national_campaign(page):
    imported(page,'campaign-national');career(page);before=export(page)
    capture(page,'full-role-national-campaign')
    page.get_by_text('Una campaña para todo el país',exact=True).click()
    page.get_by_role('button',name='Presentar mi agenda',exact=False).click()
    page.get_by_role('button',name='Participar en el debate',exact=False).click()
    after=export(page);assert after['campaign']['nationalAgenda'] and len(after['campaign']['debateHistory'])==1
    assert after['campaign']['actionsRemaining']==0 and after['player']['resources']['campaignFunds']==before['player']['resources']['campaignFunds']-4
    capture(page,'full-role-national-after-debate');return {'agenda':True,'debate':True,'costAndActionBudget':True}

def hegemony(page):
    imported(page,'hegemony');career(page);before=export(page)
    buttons=page.locator('.career-page .proposal button');target=next(b for b in buttons.all() if b.is_enabled());target.click()
    after=export(page);assert after['regime']['actionsRemaining']==before['regime']['actionsRemaining']-1
    assert after['regime']!=before['regime'];capture(page,'full-role-hegemony');return {'explicitFictionalVariant':True,'actualRegimeAction':True}

def financing(page):
    imported(page,'financing-pending');before=export(page)
    page.get_by_role('button',name='Mesa de mapas:',exact=False).click();page.locator('.world-panel').wait_for()
    page.get_by_text('Relaciones, acuerdos y decisiones con',exact=False).click()
    card=page.get_by_role('article',name='Apoyo del FMI');button=card.get_by_role('button',name='Someter a votación',exact=True)
    button.click();after=export(page);assert after['geopolitics']['treaties'][-1]['status']=='ratified'
    assert after['player']['resources']['politicalCapital']==before['player']['resources']['politicalCapital']-3
    capture(page,'full-role-financing');desk(page)
    page.get_by_role('button',name='Fin de turno',exact=False).click();page.get_by_role('button',name='Abrir mi despacho',exact=False).click()
    advanced=export(page);program=advanced['geopolitics']['treaties'][-1]['financing'];assert program['tranches']==1 and program['disbursedPercentGdp']>0
    page.reload(wait_until='networkidle');assert export(page)==advanced
    return {'actualRatification':True,'firstTrancheOnce':True,'saveExact':True}

with sync_playwright() as p:
    browser=getattr(p,ENGINE).launch(headless=True)
    scenarios=[('legislation',legislation),('party-leadership',lambda pg:role(pg,'party-leadership','Unificar facciones','partyLeadership',5)),('minister',lambda pg:role(pg,'minister','Entregar resultados','ministry',0)),('executive',executive),('challenge',challenge),('investiture',investiture),('legacy',legacy),('forty-year-memory',long_memory),('audio-motion',audio_motion),('national-campaign',national_campaign),('hegemony',hegemony),('financing',financing)]
    only=os.environ.get('MANDATO_COMPLETION_SCENARIOS','').split(',')
    for name,fn in scenarios:
        if only!=[''] and name not in only:continue
        context=browser.new_context(viewport={'width':WIDTH,'height':HEIGHT},accept_downloads=True)
        context.add_init_script("window.__audioCreated=0;const A=window.AudioContext;window.AudioContext=class extends A{constructor(...args){super(...args);window.__audioCreated++;window.__audioState=this;}};")
        page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        try:
            data=fn(page);assert not errors,errors;results.append(dict(scenario=name,status='passed',data=data));print('PASS completion',name,flush=True)
        except Exception as e:
            results.append(dict(scenario=name,status='failed',error=traceback.format_exc(),errors=errors));page.screenshot(path=str(OUT/('failed-completion-'+name+'.png')));print('FAIL completion',name,str(e)[:500],flush=True)
        finally:context.close()
    browser.close()
(OUT/'completion-evidence.json').write_text(json.dumps(dict(base=BASE,engine=ENGINE,results=results),ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'contrast-evidence.json').write_text(json.dumps(dict(limitations='Solo texto con colores CSS opacos; no mide imágenes, gráficos ni un lector de pantalla.',results=contrasts),ensure_ascii=False,indent=2),encoding='utf-8')
if any(r['status']!='passed' for r in results):raise SystemExit(1)
