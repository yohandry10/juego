"""Bundle verified official fonts and responsive art; no external runtime requests."""
from pathlib import Path
import hashlib, json, urllib.request
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public/assets"
fonts = ASSETS / "fonts"
fonts.mkdir(parents=True, exist_ok=True)
records = []
for repo, files in {
    "source-serif": ["SourceSerif4Display-Regular", "SourceSerif4Display-Semibold"],
    "source-sans": ["SourceSans3-Regular", "SourceSans3-Semibold"],
}.items():
    for name in files:
        url = f"https://raw.githubusercontent.com/adobe-fonts/{repo}/release/WOFF2/TTF/{name}.ttf.woff2"
        target = fonts / f"{name}.woff2"
        if not target.exists():
            target.write_bytes(urllib.request.urlopen(url, timeout=30).read())
        assert target.read_bytes()[:4] == b"wOF2"
        records.append({"id": name, "category": "font", "status": "licencia abierta", "url": url, "author": "Adobe", "license": "OFL-1.1", "date": "2026-10-06", "sha256": hashlib.sha256(target.read_bytes()).hexdigest(), "file": f"/assets/fonts/{target.name}"})
    license_url = f"https://raw.githubusercontent.com/adobe-fonts/{repo}/release/LICENSE.md"
    (fonts / f"{repo}-LICENSE.md").write_bytes(urllib.request.urlopen(license_url, timeout=30).read())

office = Image.open(ROOT / "design/etapa-a/assets/originales/01-despacho.png").convert("RGB")
art = ASSETS / "office"
art.mkdir(parents=True, exist_ok=True)
for width in [480, 900, 1600]:
    target = art / f"despacho-{width}.webp"
    office.resize((width, round(width * office.height / office.width)), Image.Resampling.LANCZOS).save(target, "WEBP", quality=84, method=6)
    records.append({"id": f"despacho-{width}", "category": "office", "status": "generada", "file": f"/assets/office/{target.name}", "promptFile": "design/etapa-a/prompts/01-despacho.txt", "date": "2026-10-06", "author": "Generada con ChatGPT", "license": "OpenAI Terms of Use, 2026-01-01", "source": "ChatGPT: Generar Imagen Política", "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
manifest_path = ASSETS / "manifest.json"
previous = json.loads(manifest_path.read_text(encoding="utf8")) if manifest_path.exists() else {"assets": []}
record_ids = {entry['id'] for entry in records}
records += [entry for entry in previous['assets'] if entry['id'] not in record_ids]
manifest_path.write_text(json.dumps({"version": 1, "assets": records}, ensure_ascii=False, indent=2), encoding="utf8")
print(json.dumps({"fonts": len(list(fonts.glob("*.woff2"))), "responsiveArtBytes": {p.name:p.stat().st_size for p in art.glob("*.webp")}}, indent=2))
