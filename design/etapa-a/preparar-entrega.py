"""Build a static review document; does not import or modify game code.

After ChatGPT can generate again, use --sheet PATH to crop its 2-column,
3-row reference sheet. Crops still require visual review and user approval.
"""
import argparse
import hashlib
import html
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

root = Path(__file__).resolve().parent
assets = root / 'assets'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--sheet', type=Path, help='Explicit downloaded ChatGPT sheet, two columns and three rows')
args = parser.parse_args()
tokens = json.loads((root / 'tokens.json').read_text(encoding='utf-8'))
colors = tokens['color']

sheet_targets = ['02-carta', '03-hemiciclo', '04-prensa', '05-mapa', '06-personaje', '07-despacho-nacional']
if args.sheet:
    sheet = Image.open(args.sheet).convert('RGB')
    width, height = sheet.size
    if abs((width / 2) / (height / 3) - 16 / 9) > 0.15:
        raise SystemExit('Unexpected sheet ratio: inspect the actual image before cropping.')
    sheet.save(assets / 'originales' / '02-tablero-lote.png')
    for index, target in enumerate(sheet_targets):
        x, y = index % 2, index // 2
        bounds = (round(x * width / 2), round(y * height / 3),
                  round((x + 1) * width / 2), round((y + 1) * height / 3))
        sheet.crop(bounds).save(assets / f'{target}.webp', quality=88, method=6)

prompt_one = (root / 'prompts/01-despacho.txt').read_text(encoding='utf-8').strip()
prompt_batch = (root / 'prompts/02-tablero-lote.txt').read_text(encoding='utf-8').strip()
style = prompt_one.split('\n\n')[0]
assert prompt_batch.startswith(style + '\n\n'), 'Fixed style paragraph changed between prompts.'
entries = [
    ('01-despacho', 'escena', 'El despacho', 'La carpeta iluminada reúne las decisiones; la ciudad cuenta el momento de la carrera.'),
    ('02-carta', 'carta-decision', 'Una decisión, un conflicto', 'Huelga de transporte, rostros implicados, consejo del asesor y opciones con costos.'),
    ('03-hemiciclo', 'congreso', 'La noche del voto', 'Semicírculo de escaños, firmeza y conteo. Los votos reales se dibujarán en SVG.'),
    ('04-prensa', 'prensa', 'Lo que cuenta el país', 'Portada marfil, titular dominante, viñeta y reacciones; texto de verdad en HTML.'),
    ('05-mapa', 'mundo', 'El mundo tiene peso', 'Relieve oscuro, bloques, rutas y estandartes sobre geometría real abierta.'),
    ('06-personaje', 'personaje', 'Una carrera con rostro', 'Retrato ficticio, biografía y carnet; cifras en el expediente que se abre bajo demanda.')
]
items = []
for index, (asset_id, category, title, description) in enumerate(entries):
    image_path = assets / f'{asset_id}.webp'
    exists = image_path.exists()
    record = {
        'id': asset_id, 'category': category, 'title': title,
        'description': description, 'status': 'pendiente',
        'approval': 'pending-user-approval' if exists else 'pending-generation',
        'date': '2026-10-06' if exists else None,
        'plannedDate': '2026-10-06',
        'file': f'assets/{asset_id}.webp' if exists else None,
        'original': 'assets/originales/01-despacho.png' if index == 0 else None,
        'promptFile': 'prompts/01-despacho.txt' if index == 0 else 'prompts/02-tablero-lote.txt',
        'promptUsed': prompt_one if index == 0 else None,
        'plannedPrompt': None if index == 0 else prompt_batch,
        'generationSource': 'ChatGPT existing signed-in in-app session' if exists else None,
        'visualReview': 'approved-by-agent-as-style-reference; see revision-artistica.md' if index == 0 else 'pending',
        'sheetSlot': None if index == 0 else {'column': (index - 1) % 2, 'row': (index - 1) // 2}
    }
    if exists:
        record['dimensions'] = list(Image.open(image_path).size)
        record['bytes'] = image_path.stat().st_size
        record['sha256'] = hashlib.sha256(image_path.read_bytes()).hexdigest()
    items.append(record)
manifest = {
    'version': 1, 'stage': 'A', 'status': 'partial-pending-images',
    'fixedStyle': style, 'styleSha256': hashlib.sha256(style.encode()).hexdigest(),
    'sessionUrl': 'https://chatgpt.com/c/6ac5c105-1478-83e9-ad34-b585a1290f38',
    'generationStopped': {
        'reason': 'Storage limit while attaching first image as reference. Next prompt not submitted.',
        'notice': 'No tienes suficiente espacio de almacenamiento para guardar este archivo.',
        'evidence': 'captura-limite-chatgpt.jpg',
        'userRule': 'Stop the image task on login, captcha or usage limit; no bypass.',
        'referenceAttachment': 'Original attached to an unsent draft; account settings unchanged'
    },
    'integration': 'None. No game asset loader or UI components implemented before board approval.',
    'assets': items
}
(assets / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def luminance(hex_color):
    channels = [int(hex_color[i:i+2], 16) / 255 for i in (1, 3, 5)]
    channels = [c / 12.92 if c <= 0.04045 else ((c + .055) / 1.055) ** 2.4 for c in channels]
    return sum(c * weight for c, weight in zip(channels, [.2126, .7152, .0722]))

pairs = [('paper', 'forest'), ('paperMuted', 'surface'), ('ink', 'paper'),
         ('ink', 'agency'), ('paper', 'crisis'), ('crisisText', 'forest'),
         ('achievement', 'forest'), ('information', 'forest'), ('ochre', 'forest')]
contrast = []
for foreground, background in pairs:
    light, dark = sorted([luminance(colors[foreground]), luminance(colors[background])], reverse=True)
    ratio = (light + .05) / (dark + .05)
    contrast.append({'foreground': foreground, 'background': background,
                     'ratio': round(ratio, 2), 'normalTextAA': ratio >= 4.5})
(root / 'contraste-tokens.json').write_text(json.dumps({
    'method': 'sRGB relative luminance; solid token pairs, no illustrated backgrounds',
    'results': contrast,
    'rule': 'Put readable text on opaque paper or forest surfaces; test actual components after approval.'
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
assert all(pair['normalTextAA'] for pair in contrast), contrast

# Contact sheets of the actual app, with text outside the screenshots.
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 24)
small_font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 18)
screens = ['inicio', 'campana-y-ficha', 'bandeja', 'congreso', 'prensa', 'mundo']
for viewport in (1440, 900):
    tile_w, tile_h = 560, round(560 * 960 / viewport)
    margin, label_h, gap = 32, 40, 20
    canvas = Image.new('RGB', (margin * 2 + tile_w * 3 + gap * 2,
        margin * 2 + 64 + (tile_h + label_h + gap) * 2), colors['forest'])
    draw = ImageDraw.Draw(canvas)
    draw.text((margin, margin), f'MANDATO · UI actual · {viewport} × 960 · Etapa A', fill=colors['paper'], font=font)
    for index, name in enumerate(screens):
        x = margin + (index % 3) * (tile_w + gap)
        y = margin + 64 + (index // 3) * (tile_h + label_h + gap)
        draw.text((x, y), name.replace('-', ' ').upper(), fill=colors['agency'], font=small_font)
        img = Image.open(root / 'capturas-actuales' / f'{name}-{viewport}.png').convert('RGB')
        canvas.paste(img.resize((tile_w, tile_h), Image.Resampling.LANCZOS), (x, y + label_h))
    canvas.save(root / f'auditoria-{viewport}.png')

# A clearly incomplete six-slot board. Pending slots are not generated art.
tile_w, tile_h, gap, margin = 760, 428, 28, 40
board = Image.new('RGB', (margin * 2 + tile_w * 2 + gap, 120 + margin + (tile_h + 82 + gap) * 3), colors['forest'])
draw = ImageDraw.Draw(board)
draw.text((margin, 30), 'MANDATO · DIRECCIÓN VISUAL A · 1 DE 6 REFERENCIAS', fill=colors['paper'], font=font)
draw.text((margin, 70), 'Tablero parcial. Cinco imágenes pendientes por límite de ChatGPT. Sin integración en el juego.', fill=colors['paperMuted'], font=small_font)
for index, item in enumerate(items):
    x, y = margin + (index % 2) * (tile_w + gap), 120 + (index // 2) * (tile_h + 82 + gap)
    if item['file']:
        img = ImageOps.fit(Image.open(root / item['file']).convert('RGB'), (tile_w, tile_h), method=Image.Resampling.LANCZOS)
        board.paste(img, (x, y))
    else:
        draw.rectangle((x, y, x + tile_w, y + tile_h), fill=colors['surface'], outline=colors['border'], width=2)
        draw.text((x + 32, y + 160), 'PENDIENTE DE GENERACIÓN', fill=colors['paperMuted'], font=font)
        draw.text((x + 32, y + 205), 'Prompt preparado · no enviado · sin imagen todavía', fill=colors['paperMuted'], font=small_font)
    draw.text((x, y + tile_h + 16), f'{index+1:02}  {item["title"]}', fill=colors['paper'], font=font)
    draw.text((x, y + tile_h + 50), 'Referencia IA · pendiente de aprobación' if item['file'] else 'Referencia pendiente', fill=colors['paperMuted'], font=small_font)
board.save(root / 'tablero-parcial.png')

palette = ''.join(f'<li><span style="background:{colors[name]}"></span><b>{html.escape(name)}</b> {colors[name]}</li>'
    for name in ['forest', 'ink', 'paper', 'ochre', 'agency', 'crisis', 'achievement'])
figures = ''.join(f'<figure><a href="{item["file"]}"><img src="{item["file"]}" alt="{html.escape(item["description"])}"></a><figcaption>{index+1:02} · {html.escape(item["title"])} — referencia IA pendiente de aprobación.</figcaption></figure>'
    if item['file'] else f'<article class="pending"><p class="kicker">{index+1:02} · PENDIENTE DE GENERACIÓN</p><h3>{html.escape(item["title"])}</h3><p>{html.escape(item["description"])}</p></article>'
    for index, item in enumerate(items))
audit_images = ''.join(f'<figure><a href="capturas-actuales/{name}-1440.png"><img loading="lazy" src="capturas-actuales/{name}-1440.png" alt="Interfaz actual: {name}"></a><figcaption>{html.escape(name.replace("-", " "))} · 1440 px · <a href="capturas-actuales/{name}-900.png">ver 900 px</a></figcaption></figure>' for name in screens)
document = f'''<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MANDATO · revisión visual A</title>
<style>
*{{box-sizing:border-box}}body{{margin:0;background:{colors['forest']};color:{colors['paper']};font:18px/1.5 system-ui,sans-serif}}main{{max-width:1280px;margin:auto;padding:48px 32px}}h1,h2,h3{{font-family:Georgia,serif;line-height:1.12}}h1{{font-size:64px;margin:8px 0 24px}}h2{{font-size:36px;margin-top:64px}}h3{{font-size:26px}}.kicker{{color:{colors['agency']};letter-spacing:.12em;font-size:16px}}p{{max-width:880px}}a{{color:{colors['agency']}}}figure{{margin:0}}img{{width:100%;display:block}}figcaption{{font-size:16px;margin:12px 0 28px;color:{colors['paperMuted']}}}.grid{{display:grid;grid-template-columns:1fr 1fr;gap:32px}}.grid figure:first-child{{grid-column:1/-1}}.pending{{padding:32px;border:1px dashed {colors['border']};min-height:240px;background:{colors['surface']}}}.pending .kicker{{color:{colors['paperMuted']}}}ul.palette{{list-style:none;padding:0;display:flex;gap:16px;flex-wrap:wrap}}.palette li{{font-size:16px}}.palette span{{display:block;width:110px;height:64px;border:1px solid {colors['border']}}}.notice{{padding:20px 24px;border-left:4px solid {colors['ochre']};background:{colors['surface']}}}.audit{{display:grid;grid-template-columns:1fr 1fr;gap:32px}}@media(max-width:960px){{main{{padding:28px 20px}}h1{{font-size:42px}}.grid,.audit{{grid-template-columns:1fr}}.grid figure:first-child{{grid-column:auto}}}}
</style><main><p class="kicker">MANDATO · ETAPA A · PROPUESTA PARCIAL</p><h1>El poder se vive<br>desde el despacho.</h1><p>Realismo editorial: tinta, gouache, papel y luz de cine negro político. Una escena, una persona o un conflicto dirige la mirada; las cifras aparecen cuando se abre el expediente.</p><p class="notice">Una referencia de seis generada. ChatGPT mostró un límite de almacenamiento al adjuntarla. Las cinco imágenes restantes están pendientes. La interfaz del juego sigue intacta y la Etapa B no ha empezado.</p><h2>Referencias de dirección</h2><div class="grid">{figures}</div><h2>Paleta y ritmo</h2><ul class="palette">{palette}</ul><p>Serif editorial para titulares y sans legible para datos: Source Serif 4 y Source Sans 3, propuestas con licencia abierta. Este documento usa fallbacks del sistema. Texto base 18 px; costos 16 px; blancos de interacción de 44 px; un foco y hasta tres niveles visibles.</p><p>Entrada de carta: 240 ms. Cambio de escena: 600 ms. Ceremonia de turno: hasta 1200 ms, saltable. Con movimiento reducido se muestra el resultado inmediatamente. Audio en silencio inicial, con control por canal.</p><p><a href="ficha-de-estilo.md">Ficha y párrafo fijo</a> · <a href="tokens.json">Tokens</a> · <a href="contraste-tokens.json">Contrastes</a> · <a href="assets/manifest.json">Manifiesto</a> · <a href="creditos.md">Créditos y fuentes oficiales</a></p><h2>La interfaz actual</h2><p>Revisión heurística de cinco segundos, sin sesiones humanas. El inicio parece formulario; congreso, lista; prensa, cuadrícula. El mapa tiene una base útil. Doce capturas locales, sin errores de página ni desbordamiento horizontal en los anchos observados.</p><div class="audit">{audit_images}</div><p><a href="auditoria.md">Auditoría completa y puntos débiles</a> · <a href="evidencia-ui-actual.json">Evidencia</a> · <a href="captura-limite-chatgpt.jpg">Aviso que detuvo la generación</a></p></main></html>'''
(root / 'revision.html').write_text(document, encoding='utf-8')
print('Static design review, partial board, manifest and contrast evidence ready.')
print('Contrasts:', ', '.join(f'{p["foreground"]}/{p["background"]} {p["ratio"]}:1' for p in contrast))
