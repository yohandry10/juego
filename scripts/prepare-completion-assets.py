"""Crop the approved production contact sheets; preserve all originals and alpha."""
import hashlib
import json
from pathlib import Path
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
recipe = json.loads((ROOT/'design/completion/assets/generation.json').read_text(encoding='utf-8'))
entries = []
for name, source in recipe['sourcePaths'].items():
    saved = ROOT/'design/completion/assets/originales'/f'{name}.png'
    saved.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(source,saved)
    columns,rows = (4,4) if name=='portraits' else (2,4)
    with Image.open(saved) as sheet:
        for index in range(columns*rows):
            c,r = index%columns,index//columns
            bounds = tuple(round(v) for v in (c*sheet.width/columns,r*sheet.height/rows,(c+1)*sheet.width/columns,(r+1)*sheet.height/rows))
            if name=='portraits':
                filename=f'character-{index+24:02}.webp'; directory='portraits'
            else:
                offset={'events_a':0,'events_b':8,'events_c':16}[name]
                filename=f'event-{index+offset:02}.webp'; directory='scenes'
            target = ROOT/'public/assets'/directory/filename
            target.parent.mkdir(parents=True,exist_ok=True)
            sheet.crop(bounds).save(target,'WEBP',quality=92,method=6)
            entries.append({'id':filename.removesuffix('.webp'),'file':f'/assets/{directory}/{filename}','category':'portrait' if directory=='portraits' else 'event','status':'generada','author':'MANDATO · imagegen','sourceFile':saved.relative_to(ROOT).as_posix(),'promptFile':'design/completion/assets/generation.json','crop':list(bounds),'date':recipe['date'],'license':'Contenido generado con OpenAI; personajes y escenas ficticios','sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
manifest_path=ROOT/'public/assets/manifest.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
ids={entry['id'] for entry in entries}
manifest['assets']=[entry for entry in manifest['assets'] if entry['id'] not in ids]+entries
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{len(entries)} recortes integrados; originales conservados.')
