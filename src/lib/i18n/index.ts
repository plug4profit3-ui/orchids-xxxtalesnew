// Lazy-loaded locale loader. Vite will code-split each JSON import.
import type { Language } from '../../types';

// Synchronous fallback (always bundled)
import nlTexts from './nl.json';

// Map locale code -> dynamic import
const loaders: Record<string, () => Promise<any>> = {
  nl: () => Promise.resolve(nlTexts),
  en: () => import('./en.json').then(m => m.default),
  de: () => import('./de.json').then(m => m.default),
  fr: () => import('./fr.json').then(m => m.default),
  es: () => import('./es.json').then(m => m.default),
  it: () => import('./it.json').then(m => m.default),
};

const cache: Partial<Record<Language, any>> = { nl: nlTexts };

export async function loadLocale(lang: Language): Promise<void> {
  if (cache[lang]) return;
  const loader = loaders[lang] ?? loaders.nl;
  cache[lang] = await loader();
}

export function getLocale(lang: Language): any {
  return cache[lang] ?? nlTexts;
}

export function t(lang: Language, section: string, key: string): string {
  const locale = getLocale(lang);
  return locale?.[section]?.[key] ?? nlTexts[section as keyof typeof nlTexts]?.[key as any] ?? key;
}
