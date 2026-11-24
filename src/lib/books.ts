export type Category = 'Typography' | 'Branding' | 'Posters' | 'Layout';

export interface Book {
  index: number;
  id: string;
  title: string;
  author: string;
  category: Category;
  pages: number;
  year: number;
  score: number;
  coverColor: string;
  spineColor: string;
  endpaperColor: string;
  note: string;
  baseTilt: number;
  seed: number;
}

export const CATEGORIES: readonly Category[] = [
  'Typography',
  'Branding',
  'Posters',
  'Layout',
] as const;

const RAW_BOOKS: Array<{
  id: string;
  title: string;
  author: string;
  category: Category;
  pages: number;
  year: number;
  score: number;
  coverColor: string;
  spineColor: string;
  endpaperColor: string;
  note: string;
  baseTilt: number;
}> = [
  {
    id: '20261121_033327_214ed3f3-b77e-440f-aba1-a8f6bfef39e1',
    title: 'GRID',
    author: 'Ines Vahl',
    category: 'Layout',
    pages: 248,
    year: 2023,
    score: 4.9,
    coverColor: '#ecebe6',
    spineColor: '#cfccc4',
    endpaperColor: '#1a1a1a',
    note: 'The modular grid explained without dogma: 60 real layouts rebuilt column by column, from timetables to museum walls.',
    baseTilt: -16,
  },
  {
    id: '20261121_033326_84bf819c-5088-4118-894d-254c41530560',
    title: 'LOUD',
    author: 'Marco Teller',
    category: 'Posters',
    pages: 192,
    year: 2024,
    score: 4.7,
    coverColor: '#f26b1d',
    spineColor: '#c9520f',
    endpaperColor: '#141414',
    note: 'Posters that refuse to whisper. A field guide to scale, contrast and the courage to crop.',
    baseTilt: 12,
  },
  {
    id: '20261121_033326_08a6f155-e502-4d1d-95a6-60b7769e8b67',
    title: 'Rules of Marks',
    author: 'Juno Okafor',
    category: 'Branding',
    pages: 212,
    year: 2024,
    score: 4.8,
    coverColor: '#efe6d4',
    spineColor: '#1f4fd6',
    endpaperColor: '#f26b1d',
    note: 'How a circle becomes a company. Logos, symbols and the quiet grammar that makes a mark feel inevitable.',
    baseTilt: -8,
  },
  {
    id: '20261121_033326_c5a053e3-7715-4568-9125-10dbe94553a2',
    title: 'Shaping Identity',
    author: 'Elena Marsh',
    category: 'Branding',
    pages: 304,
    year: 2022,
    score: 4.9,
    coverColor: '#1f4a3a',
    spineColor: '#163629',
    endpaperColor: '#efe6d4',
    note: 'Identity systems as places people want to belong to — with case files from twelve studios.',
    baseTilt: 15,
  },
  {
    id: '20261121_033326_55f0fe07-e4ee-4593-9f95-048d16d00ff6',
    title: 'Make it Matter',
    author: 'Theo Brandt',
    category: 'Typography',
    pages: 176,
    year: 2025,
    score: 4.6,
    coverColor: '#c9b8ee',
    spineColor: '#a995d8',
    endpaperColor: '#f7d23e',
    note: 'Short essays on type that does a job: signage, protest, packaging and the kindness of legibility.',
    baseTilt: -13,
  },
  {
    id: '20261121_033326_6b08a110-3b3e-4ec5-bc4b-c74529c150d5',
    title: 'Type Weather',
    author: 'Ada Kowal',
    category: 'Typography',
    pages: 228,
    year: 2024,
    score: 4.8,
    coverColor: '#1d4fd6',
    spineColor: '#153ba3',
    endpaperColor: '#f4f1ea',
    note: 'Why some letters feel cold and others warm. A mood atlas of 400 typefaces, sorted by climate.',
    baseTilt: 9,
  },
  {
    id: '20261121_033327_682c9cb0-53ec-4295-be49-f580b5c227df',
    title: 'Small Ideas, Big Change',
    author: 'Rui Sato',
    category: 'Posters',
    pages: 160,
    year: 2023,
    score: 4.5,
    coverColor: '#f0491f',
    spineColor: '#c23612',
    endpaperColor: '#141414',
    note: 'One idea per page. A pocket manifesto for designers who want to move people, not pixels.',
    baseTilt: -18,
  },
  {
    id: '20261121_033326_a0acd858-b948-4dfc-ab4e-1c231920b1d3',
    title: 'Quiet Systems',
    author: 'Noor Haddad',
    category: 'Layout',
    pages: 196,
    year: 2022,
    score: 4.7,
    coverColor: '#b9b7b2',
    spineColor: '#8f8d88',
    endpaperColor: '#141414',
    note: 'Restraint as a method. Whitespace, rhythm and the systems behind calm interfaces and books.',
    baseTilt: 11,
  },
  {
    id: '20261121_033349_28c091d1-780b-4588-a455-5005f6e8cf61',
    title: 'Colour Is a Verb',
    author: 'Lena Fosse',
    category: 'Posters',
    pages: 184,
    year: 2025,
    score: 4.6,
    coverColor: '#ec3d8c',
    spineColor: '#bf2a6c',
    endpaperColor: '#ffe066',
    note: 'Colour as action: 120 palettes that change how a room, a page or a brand behaves.',
    baseTilt: -6,
  },
  {
    id: '20261121_033349_daee32f0-2cba-4282-9a73-3a9867931dba',
    title: 'Letters in Motion',
    author: 'Kai Mendez',
    category: 'Typography',
    pages: 220,
    year: 2025,
    score: 4.8,
    coverColor: '#121212',
    spineColor: '#000000',
    endpaperColor: '#d7ff3a',
    note: 'The kinetic type handbook: timing, easing and how to make words move without losing their meaning.',
    baseTilt: 17,
  },
  {
    id: '20261121_033349_da8b7941-c1f0-47e8-b671-f0e1c4059711',
    title: 'The Honest Page',
    author: 'Clara Weiss',
    category: 'Layout',
    pages: 264,
    year: 2021,
    score: 4.9,
    coverColor: '#f4f0e6',
    spineColor: '#d8d2c3',
    endpaperColor: '#d62b20',
    note: 'Editorial layout without tricks — hierarchy, measure and the respect a reader deserves.',
    baseTilt: -12,
  },
  {
    id: '20261121_033348_9e021045-5de0-46f4-bc5d-c9dda64062c3',
    title: 'Signal & Noise',
    author: 'Omar Reyes',
    category: 'Branding',
    pages: 236,
    year: 2024,
    score: 4.7,
    coverColor: '#f5e72d',
    spineColor: '#d6c61b',
    endpaperColor: '#141414',
    note: 'Branding in a crowded world: how distinct brands cut through without shouting louder.',
    baseTilt: 7,
  },
];

export const BOOKS: Book[] = RAW_BOOKS.map((book, index) => ({
  ...book,
  index,
  seed: Math.sin(index * 91.7) * 0.5 + 0.5,
}));

export function getBookPngUrl(id: string): string {
  return `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_${id}.png`;
}

export function getBookCoverUrl(id: string, width: 900 | 300 | 200 | 160 | 120): string {
  const png = getBookPngUrl(id);
  return `https://images.higgs.ai/?default=1&output=webp&url=${encodeURIComponent(png)}&w=${width}&q=85`;
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function matchesQuery(book: Book, query: string): boolean {
  const trimmed = normalizeText(query.trim());
  if (!trimmed) return true;
  return (
    normalizeText(book.title).includes(trimmed) ||
    normalizeText(book.author).includes(trimmed) ||
    normalizeText(book.category).includes(trimmed)
  );
}

export function filterBooks(
  books: readonly Book[],
  query: string,
  activeCategory: Category | null,
): Book[] {
  return books.filter((book) => {
    if (activeCategory && book.category !== activeCategory) {
      return false;
    }
    return matchesQuery(book, query);
  });
}

export function getCategoryCounts(books: readonly Book[]): Record<Category, number> {
  const counts: Record<Category, number> = {
    Typography: 0,
    Branding: 0,
    Posters: 0,
    Layout: 0,
  };
  for (const book of books) {
    counts[book.category] += 1;
  }
  return counts;
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

export function getHighlightSegments(text: string, query: string): HighlightSegment[] {
  const needle = normalizeText(query.trim());
  if (!needle) {
    return [{ text, match: false }];
  }

  // Map each normalized character back to its original character index span.
  const chars = Array.from(text);
  let normalized = '';
  const normToOrigStart: number[] = [];
  const normToOrigEnd: number[] = [];

  let offset = 0;
  for (const ch of chars) {
    const chLen = ch.length;
    const stripped = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    for (let j = 0; j < stripped.length; j += 1) {
      normalized += stripped[j];
      normToOrigStart.push(offset);
      normToOrigEnd.push(offset + chLen);
    }
    offset += chLen;
  }

  const idx = normalized.indexOf(needle);
  if (idx === -1) {
    return [{ text, match: false }];
  }

  const startOrig = normToOrigStart[idx];
  const endOrig = normToOrigEnd[idx + needle.length - 1];

  const segments: HighlightSegment[] = [];
  if (startOrig > 0) {
    segments.push({ text: text.slice(0, startOrig), match: false });
  }
  segments.push({ text: text.slice(startOrig, endOrig), match: true });
  if (endOrig < text.length) {
    segments.push({ text: text.slice(endOrig), match: false });
  }
  return segments;
}

export const THROW_TOASTS = [
  'Nice throw.',
  'It always comes back.',
  'Gravity: optional.',
] as const;
