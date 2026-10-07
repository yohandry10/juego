/** Original procedural editorial portraits. Identity depends only on the supplied key. */
export function portraitSeed(key: string): number {
  let seed = 2166136261;
  for (const letter of key) seed = Math.imul(seed ^ letter.charCodeAt(0), 16777619);
  return seed >>> 0;
}

export function portraitSvg(key: string, accent = "#80976A", age = 40): string {
  const seed = portraitSeed(key);
  const variant = (shift: number, count: number) => (seed >>> shift) % count;
  const skin = ["#E0BE94", "#C59A73", "#AD7D59", "#865A43", "#69493B", "#E6CCAC"][variant(4, 6)];
  const hair = age > 60 ? "#BEB99D" : ["#151C18", "#453728", "#69513B", "#8C7760"][variant(9, 4)];
  const face = variant(0, 4);
  const left = 40 - face * 2;
  const right = 88 + face * 2;
  const longHair = variant(12, 3) === 0;
  const hairstyle = variant(15, 5);
  const nose = 63 + variant(19, 5);
  const glasses = variant(22, 3) === 0;
  const beard = !longHair && variant(24, 4) === 0;
  const shirt = variant(26, 3);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 144" fill="none"><defs><pattern id="grain" width="9" height="11" patternUnits="userSpaceOnUse"><path d="M1 2h1M6 7h2" stroke="#0B100E" opacity=".15"/></pattern></defs><path fill="#D6CEB5" d="M0 0h128v144H0z"/><path fill="${accent}" opacity=".5" d="M0 0h48L14 144H0z"/><path fill="#101C18" d="M6 144q1-32 31-37l23-12 23 11q33 4 39 38"/><path fill="${hair}" d="M${left-5} 82Q22 18 63 17q49-1 33 73${longHair ? 'l9 26-31-3-35 1-12-25' : ''}Z"/><path fill="${skin}" stroke="#293329" stroke-width="1.6" d="M${left} 53Q${left} 24 65 27q${right-65} 0 ${right-65} 26l-3 30q-5 21-24 23-24-3-27-25Z"/><path fill="${skin}" d="M52 98v16l13 13 12-16-1-14"/><path fill="${hair}" d="${['M32 58Q31 15 67 17q34 0 31 39L79 36 49 49Z','M32 57Q24 19 61 17q43-9 37 37L70 27 38 51Z','M36 53q-4-37 30-37 31 2 31 35L76 32 43 39Z','M34 54q-3-27 16-34L78 18q23 13 17 36L76 34 45 48Z','M35 49l8-19 10-8 30 3 12 24-21-12-24 1Z'][hairstyle]}"/><path stroke="#293329" stroke-width="2" d="M43 60l13-2m17 0 12 2M${nose} 64l-3 15 7 2M54 90q12 ${variant(2,2) ? '6' : '-3'} 23-1"/><path fill="#101C18" d="M49 64h4v3h-4zm28 0h4v3h-4z"/>${glasses ? '<g stroke="#101C18" stroke-width="2"><rect x="40" y="58" width="20" height="15" rx="4"/><rect x="70" y="58" width="20" height="15" rx="4"/><path d="M60 64h10"/></g>' : ''}${beard ? `<path fill="${hair}" opacity=".85" d="M42 82l14 7 10 5 13-7 8-8q-3 23-23 25-17-2-22-22Z"/>` : ''}${age > 50 ? '<path stroke="#805F45" opacity=".6" d="M41 74l10 2m28 0 8-2M51 49l11-2m6 0 9 2"/>' : ''}<path fill="#F4EAD3" d="M42 108l21 18-14 18H38l-11-22Zm43 0-22 18 12 18h15l13-21Z"/><path fill="${accent}" d="${shirt === 0 ? 'M59 126h9l5 18H55Z' : shirt === 1 ? 'M35 123l12 21h9l-15-29Zm59-4-18 25h9l15-18Z' : 'M49 144l14-18 12 18Z'}"/><path fill="url(#grain)" d="M0 0h128v144H0z"/><path stroke="#0B100E" opacity=".35" d="M4 8l2 131M121 7l3 132"/></svg>`;
}
