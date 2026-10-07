export type GameTab = 'desk' | 'career' | 'inbox' | 'people' | 'press' | 'economy' | 'world' | 'country' | 'help';
/** Normalized rectangles in the original 1672 x 940 art. Keep hit areas disjoint. */
export const officeZones = [
  { id: 'phone', label: 'Teléfono', hint: 'Llamadas y ofertas', destination: 'inbox', x: .02, y: .54, w: .19, h: .23 },
  { id: 'folder', label: 'La carpeta', hint: 'Decisiones pendientes', destination: 'inbox', x: .31, y: .62, w: .27, h: .18 },
  { id: 'press', label: 'El periódico', hint: 'Lo que dice la prensa', destination: 'press', x: .71, y: .65, w: .29, h: .20 },
  { id: 'map', label: 'Mesa de mapas', hint: 'El mundo y tus aliados', destination: 'world', x: .23, y: .53, w: .48, h: .08 },
  { id: 'window', label: 'La ventana', hint: 'Tu país y su economía', destination: 'economy', x: .33, y: .10, w: .25, h: .39 },
  { id: 'congress', label: 'El Congreso', hint: 'Los votos que necesitas', destination: 'people', x: .58, y: .18, w: .10, h: .17 },
  { id: 'calendar', label: 'Calendario', hint: 'Tu agenda y el siguiente paso', destination: 'career', x: .77, y: .09, w: .12, h: .27 },
  { id: 'ledger', label: 'Libro mayor', hint: 'Favores, pactos y rencores', destination: 'people', x: .86, y: .39, w: .14, h: .12 },
  { id: 'chair', label: 'Tu silla', hint: 'Tu trayectoria y personaje', destination: 'career', x: .24, y: .84, w: .56, h: .16 },
] as const;
