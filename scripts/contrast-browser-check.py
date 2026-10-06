import json
from pathlib import Path
from playwright.sync_api import sync_playwright

audit = """() => {
 const rgb = (s) => s.match(/[\\d.]+/g).map(Number);
 const lum = (s) => {const v=rgb(s).slice(0,3).map(n=>{let x=n/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return v[0]*.2126+v[1]*.7152+v[2]*.0722};
 const failures=[]; let checked=0;
 for(const node of document.querySelectorAll('body *')) {
   if(node.closest('svg') || ![...node.childNodes].some(n=>n.nodeType===3 && n.textContent.trim())) continue;
   const s=getComputedStyle(node), r=node.getBoundingClientRect();
   if(!r.width||!r.height||s.visibility==='hidden'||node.closest('[disabled]')) continue;
   let p=node,bg='rgb(16,24,21)';
   while(p){let b=getComputedStyle(p).backgroundColor;const vals=rgb(b);if(vals.length===3||vals[3]===1){bg=b;break;}p=p.parentElement;}
   const v=[lum(s.color),lum(bg)].sort((a,b)=>b-a), ratio=(v[0]+.05)/(v[1]+.05);
   const large=parseFloat(s.fontSize)>=24 || parseFloat(s.fontSize)>=18.66&&parseInt(s.fontWeight)>=700;
   checked++;
   if(ratio<(large?3:4.5)) failures.push({text:node.textContent.trim().slice(0,70),color:s.color,background:bg,ratio});
 }
 return {checked,failures};
}"""
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://127.0.0.1:4173/", wait_until="networkidle")
    results.append({"view": "initial", **page.evaluate(audit)})
    page.get_by_label("Nombre público").fill("Elena Ríos")
    for _ in range(5):
        page.get_by_role("button", name="Siguiente paso").click()
        results.append({"view": "creation", **page.evaluate(audit)})
    page.get_by_role("button", name="Empezar campaña").click()
    for label in ["01 Carrera", "02 Bandeja", "03 Congreso", "04 Prensa", "05 Economía", "06 Mundo", "07 País", "08 Ayuda"]:
        page.get_by_role("button", name=label).click()
        if label == "06 Mundo":
            page.locator(".world-map").wait_for()
        if label == "08 Ayuda":
            page.get_by_role("heading", name="Primeros diez minutos").wait_for()
        results.append({"view": label, **page.evaluate(audit)})
    browser.close()
Path("docs/contrast-browser-evidence.json").write_text(json.dumps({"date": "2026-10-06", "limitations": "Colores CSS opacos frente al fondo más próximo; no sustituye revisión visual, gráficos SVG, lectores de pantalla ni medición de todos los estados posibles.", "results": results}, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
failures = [r for r in results if r["failures"]]
assert not failures, failures
print("OK: contraste del inicio, creador y las ocho vistas en Chromium.")
