const femalePrefixes = new Set(['Unión','Alianza','Coalición','Liga']);
export function formatPartyName(prefix: string, quality: string): string {
  const agreeing = femalePrefixes.has(prefix) ? ({ Cívico:'Cívica',Renovador:'Renovadora',Democrático:'Democrática' } as Record<string,string>)[quality] ?? quality : quality;
  return `${prefix} ${agreeing}`;
}
const surnames: Record<string, readonly string[]> = {
  spanish: ['Rojas','Salazar','Mendoza','Vargas','Paredes','Quispe','Cárdenas','León','Navarro','Campos','Reyes','Silva','Flores','Castro','Guzmán','Torres','Vega','Cruz','Arias','Medina','Molina','Aguilar','Ramos','Soto','Herrera','Delgado','Ortega','Valdés','Fuentes','Vidal','Ponce','Suárez','Acosta','Roldán','Ibarra','Benítez','Cabrera','Morales','Carrasco','Montoya','Sánchez'],
  germany:['Weber','Schneider','Fischer','Wagner','Becker','Hoffmann','Schulz','Koch','Richter','Klein','Wolf','Schröder','Neumann','Braun','Zimmermann','Schwarz','Hartmann','Krüger','Werner','Lange','Krause','Meier','Schmidt'],
  france:['Martin','Bernard','Dubois','Thomas','Robert','Richard','Petit','Durand','Leroy','Moreau','Simon','Laurent','Lefebvre','Michel','Garcia','Roux','Vincent','Fournier','Morel','Girard','André','Mercier','Fontaine'],
  brazil:['Silva','Santos','Oliveira','Souza','Lima','Pereira','Costa','Carvalho','Almeida','Ferreira','Ribeiro','Rodrigues','Gomes','Martins','Barbosa','Rocha','Dias','Teixeira','Melo','Castro','Azevedo','Cardoso','Nunes'],
  english:['Morgan','Wilson','Taylor','Brown','Williams','Johnson','Davis','Robinson','Clark','Walker','Hall','Allen','Wright','King','Green','Hill','Baker','Adams','Nelson','Campbell','Mitchell','Roberts','Carter'],
};
const given: Record<string, readonly string[]> = {
  spanish:['Lucía','Mateo','Valeria','Diego','Camila','Andrés','Mariana','Joaquín','Sofía','Gabriel','Elena','Nicolás','Rosa','Tomás','Daniela','Bruno','Ana','Martín','Paola','Emilio'],
  germany:['Lea','Jonas','Miriam','Felix','Clara','Lukas','Hannah','Leon','Mara','Paul','Nora','Emil','Lena','Max','Anna','Moritz','Jana','David','Sofia','Anton'],
  france:['Camille','Louis','Manon','Gabriel','Élise','Hugo','Léa','Arthur','Chloé','Jules','Nina','Victor','Alice','Mathieu','Sarah','Antoine','Zoé','Thomas','Inès','Lucas'],
  brazil:['Ana','Pedro','Beatriz','Rafael','Marina','Gabriel','Luiza','Lucas','Helena','Bruno','Clara','João','Isabela','Felipe','Julia','André','Camila','Daniel','Paula','Mateus'],
  english:['Amelia','Oliver','Charlotte','Noah','Maya','James','Grace','Ethan','Isla','Henry','Olivia','Daniel','Sophia','Benjamin','Ava','Samuel','Emily','Thomas','Ella','Alexander'],
};
export function fictionalPoliticalName(countryId: string, index: number): string {
  const culture = ['united-states','united-kingdom'].includes(countryId) ? 'english' : surnames[countryId] ? countryId : 'spanish';
  const first = given[culture]!; const family = surnames[culture]!;
  return `${first[index % first.length]} ${family[(index*7+Math.floor(index/first.length))%family.length]}`;
}
