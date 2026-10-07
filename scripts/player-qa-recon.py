from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path(__file__).resolve().parents[1] / 'docs/qa-player/2026-10-07'
out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    page.goto('http://127.0.0.1:5174/', wait_until='networkidle')
    print('START', page.locator('body').inner_text())
    page.screenshot(path=str(out / '01-start.png'))
    page.get_by_role('button', name='Elegir mi cargo', exact=False).click()
    print('SETUP', page.locator('body').inner_text())
    print('INPUTS', page.locator('input').evaluate_all("els => els.map(e=>({type:e.type,label:e.getAttribute('aria-label'),value:e.value}))"))
    page.screenshot(path=str(out / '02-setup.png'))
    page.get_by_role('button', name='Entrar al juego', exact=False).click()
    page.wait_for_load_state('networkidle')
    print('OFFICE', page.locator('body').inner_text())
    print('BUTTONS', page.get_by_role('button').all_text_contents())
    page.screenshot(path=str(out / '03-office.png'))
    browser.close()
