import { portraitSeed } from './portraits.js';

const advisors = new Set(['advisor-politics', 'advisor-economy', 'advisor-campaign', 'advisor-cabinet', 'advisor-security', 'advisor-press']);

/** Stable visual identity, independent of renders, age changes and navigation. */
export function portraitAsset(identity: string): string {
  if (advisors.has(identity)) return `/assets/portraits/${identity}.webp`;
  const preview = /^politician-(\d+)$/.exec(identity) ?? /:portrait:(\d+)$/.exec(identity);
  // Existing saves keep their original assignment; new characters can choose any of 40 faces.
  const index = preview ? Number(preview[1]) % 40 : portraitSeed(identity) % 24;
  return `/assets/portraits/character-${String(index).padStart(2, '0')}.webp`;
}
