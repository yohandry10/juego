"""Prepare the user's downloaded contact sheets without repainting the artwork."""
from pathlib import Path
from PIL import Image
import hashlib
import json
import shutil

root = Path(__file__).resolve().parents[1]
downloads = Path.home() / "Downloads"
originals = root / "design/vertical-slice/assets/originales"
output = root / "public/assets/portraits"
originals.mkdir(parents=True, exist_ok=True)
output.mkdir(parents=True, exist_ok=True)

sheets = [
    ("Retratos de estrategia en tonos oliva.png", "advisors.png", 3, 2,
     ["advisor-politics", "advisor-economy", "advisor-campaign", "advisor-cabinet", "advisor-security", "advisor-press"]),
    ("Cuadrícula de 24 retratos profesionales.png", "characters.png", 6, 4,
     [f"character-{index:02d}" for index in range(24)]),
]
entries = []
for source_name, stored_name, columns, rows, identities in sheets:
    source = downloads / source_name
    shutil.copy2(source, originals / stored_name)
    with Image.open(source) as sheet:
        width, height = sheet.size
        for index, identity in enumerate(identities):
            column, row = index % columns, index // columns
            bounds = (round(column * width / columns), round(row * height / rows),
                      round((column + 1) * width / columns), round((row + 1) * height / rows))
            file = output / f"{identity}.webp"
            sheet.crop(bounds).save(file, "WEBP", quality=94, method=6)
            entries.append({"id": identity, "file": f"/assets/portraits/{file.name}",
                            "category": "portrait", "status": "generada",
                            "author": "Generada con ChatGPT; archivo aportado por el usuario",
                            "source": "ChatGPT: Generar Imagen Política",
                            "sourceFile": f"design/vertical-slice/assets/originales/{stored_name}",
                            "crop": list(bounds), "date": "2026-10-07",
                            "license": "OpenAI Terms of Use; procedencia registrada, sin nueva revisión legal",
                            "sha256": hashlib.sha256(file.read_bytes()).hexdigest()})

manifest_file = root / "public/assets/manifest.json"
manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
manifest["assets"] = [entry for entry in manifest["assets"]
                      if entry["id"] not in {asset["id"] for asset in entries}]
for entry in manifest["assets"]:
    if entry["id"] == "portrait-runtime":
        entry.update(status="DEV FALLBACK", description="SVG conservado para pruebas históricas; no se usa en la UI de producción")
    if entry["id"] == "ai-portrait-pack":
        entry.update(status="integrada", description="Seis asesores y 24 personajes raster aportados por el usuario")
manifest["assets"].extend(entries)
manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Prepared {len(entries)} portraits; original sheets preserved.")
