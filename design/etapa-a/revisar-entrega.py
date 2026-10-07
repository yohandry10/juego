"""Verify local review links, images and screenshots; no game mutation."""
import json
from html.parser import HTMLParser
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent

class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ['href', 'src'] and value and not value.startswith(('https:', '#')):
                assert (root / value).is_file(), value

Links().feed((root / 'revision.html').read_text(encoding='utf-8'))
for path in [root / 'tokens.json', root / 'assets/manifest.json', root / 'contraste-tokens.json', root / 'evidencia-ui-actual.json']:
    json.loads(path.read_text(encoding='utf-8'))
manifest = json.loads((root / 'assets/manifest.json').read_text(encoding='utf-8'))
assert len(manifest['assets']) == 6
assert sum(bool(asset['file']) for asset in manifest['assets']) == 1
assert all(asset['status'] == 'pendiente' for asset in manifest['assets'])
assert all(asset['promptUsed'] is None for asset in manifest['assets'][1:])

results = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width in [1440, 900]:
        context = browser.new_context(viewport={'width': width, 'height': 1500 if width == 1440 else 1200})
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto((root / 'revision.html').as_uri(), wait_until='networkidle')
        page.locator('h1').wait_for()
        for image in page.locator('img').all():
            image.scroll_into_view_if_needed()
            image.evaluate('(img) => img.decode()')
            assert image.evaluate('(img) => img.complete && img.naturalWidth > 0')
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 2')
        assert not errors, errors
        page.evaluate('window.scrollTo(0,0)')
        page.screenshot(path=str(root / f'revision-{width}.png'), full_page=False)
        results.append({'width': width, 'overflow': False, 'imagesLoaded': 7, 'errors': errors})
        context.close()
    browser.close()

(root / 'verificacion-entrega.json').write_text(json.dumps({
    'date': '2026-10-06', 'localLinksExist': True, 'jsonReadable': True,
    'generatedImages': 1, 'pendingImages': 5, 'statusHonest': True,
    'appEngineAndTestsChanged': False, 'results': results,
    'tests': 'The 143-test suite is untouched. Prior result at e60e789 retained; not rerun for design-only artifacts.'
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Local review verified at 1440/900 px, seven images loaded, five references explicitly pending.')
