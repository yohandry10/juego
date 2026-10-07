import names from '../data/world-names.es.json' with { type: 'json' };
export function worldName(id: string, fallback = id): string { return (names as Record<string,string>)[id.replace('generated-', '').toLowerCase()] ?? fallback; }
