import { readFile, writeFile } from 'node:fs/promises';
const { actors } = JSON.parse(await readFile('src/data/world-actors.json', 'utf8'));
const english = new Intl.DisplayNames(['en'], { type: 'region' });
const spanish = new Intl.DisplayNames(['es'], { type: 'region' });
const normalized = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z]/g, '');
const lookup = new Map();
for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) { const code = String.fromCharCode(a,b); const name = english.of(code); if (name !== code) lookup.set(normalized(name), code); }
const aliases = { cod:'CD', cog:'CG', civ:'CI', egy:'EG', gmb:'GM', hkg:'HK', irn:'IR', kor:'KR', lao:'LA', mac:'MO', prk:'KP', pse:'PS', rus:'RU', svk:'SK', ven:'VE', yem:'YE', kgz:'KG', lca:'LC', vct:'VC', kna:'KN', stp:'ST', tur:'TR', tza:'TZ', cuw:'CW', sxm:'SX', vgb:'VG', vir:'VI', fsm:'FM' };
Object.assign(aliases, {atg:'AG',bhs:'BS',bih:'BA',brn:'BN',cpv:'CV',maf:'MF',mmr:'MM',nru:'NR',pri:'PR',som:'SO',syr:'SY',tca:'TC',tto:'TT'});
const manual = { xkx:'Kosovo', chi:'Islas del Canal' };
const names = {}; const missing = [];
for (const actor of actors) { const code = aliases[actor.id] ?? lookup.get(normalized(actor.name)); const name = manual[actor.id] ?? (code ? spanish.of(code) : null); if (!name) missing.push({id:actor.id,name:actor.name}); else names[actor.id] = name; }
if (missing.length) { console.error(JSON.stringify(missing, null, 2)); process.exitCode = 1; } else { await writeFile('src/data/world-names.es.json', JSON.stringify(names, null, 2)+'\n'); console.log(`${actors.length} nombres localizados sin cambiar identificadores ni datos.`); }
