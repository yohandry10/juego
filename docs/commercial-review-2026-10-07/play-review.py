import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('actions')
parser.add_argument('--url', default='http://127.0.0.1:5173/')
args = parser.parse_args()
actions = json.loads(Path(args.actions).read_text(encoding='utf-8'))
with sync_playwright() as pw:
    context = pw.chromium.launch_persistent_context(str(ROOT / 'browser-profile'), headless=True, viewport={'width': 1440, 'height': 900})
    page = context.pages[0] if context.pages else context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(args.url)
    page.wait_for_load_state('networkidle')
    for action in actions:
        kind = action['type']
        if kind == 'click':
            page.get_by_role(action.get('role', 'button'), name=action['name'], exact=action.get('exact', True)).click(timeout=12000)
        elif kind == 'locator-click':
            page.locator(action['selector']).click(timeout=12000)
        elif kind == 'fill':
            page.get_by_label(action['label'], exact=True).fill(action['value'])
        elif kind == 'select':
            page.get_by_label(action['label'], exact=True).select_option(action['value'])
        elif kind == 'wait':
            page.wait_for_timeout(action.get('ms', 1000))
        elif kind == 'download':
            with page.expect_download() as download_info:
                page.get_by_role('button', name=action['name'], exact=True).click()
            download_info.value.save_as(str(ROOT / action['file']))
            print(json.dumps({'download': action['file']}))
        elif kind == 'inspect':
            page.wait_for_timeout(350)
            name = action['name']
            page.screenshot(path=str(ROOT / f'{name}.png'), full_page=True)
            result = {
                'url': page.url,
                'text': page.locator('body').inner_text(),
                'buttons': page.get_by_role('button').evaluate_all('(xs) => xs.filter(x => typeof x.innerText === "string").map(x => ({text:x.innerText, label:x.getAttribute("aria-label"), disabled:x.disabled}))'),
                'inputs': page.locator('input,select').evaluate_all('(xs) => xs.map(x => ({tag:x.tagName,type:x.type,label:x.getAttribute("aria-label"),value:x.value}))'),
                'images': page.locator('img').evaluate_all('(xs) => xs.map(x => ({src:x.getAttribute("src"),loaded:x.complete && x.naturalWidth>0}))'),
                'errors': errors,
            }
            (ROOT / f'{name}.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
            print(json.dumps(result, ensure_ascii=False))
        page.wait_for_timeout(250)
    page.wait_for_timeout(1000)
    context.close()
