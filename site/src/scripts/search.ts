// The site's search: a Slab Command Palette over every page and section. It's
// all loaded the first time the search is opened, the elements and the index
// both, so a page that's never searched doesn't pay for it.

import { navigate } from 'astro:transitions/client';
import type CommandPalette from '../../../src/command-palette.ts';
import type Option from '../../../src/option.ts';
import type { SearchEntry } from '../pages/search.json.ts';

const base = import.meta.env.BASE_URL;

let building: Promise<CommandPalette> | undefined;
let entries: Promise<SearchEntry[]> | undefined;

// What an Option matches on, lowercased once rather than on every keystroke.
const haystacks = new WeakMap<Option, { text: string; title: string }>();

/**
 * How well an Option matches what's been typed, lower being better, or
 * Infinity when it doesn't. Every word typed has to be somewhere in it, and
 * one in the title counts for more than one in the rest.
 */
const score = (option: Option, query: string) => {
  const haystack = haystacks.get(option);
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);

  if (!haystack || words.length === 0) {
    return 0;
  }

  let total = 0;

  for (const word of words) {
    if (haystack.title === word) {
      total += 0;
    } else if (haystack.title.startsWith(word)) {
      total += 1;
    } else if (haystack.title.includes(` ${word}`)) {
      total += 2;
    } else if (haystack.title.includes(word)) {
      total += 3;
    } else if (haystack.text.includes(word)) {
      total += 10;
    } else {
      return Infinity;
    }
  }

  return total;
};

const build = async () => {
  // Imported for their registration alone, which a plain `import` would lose,
  // since `src` isn't in the package's side effects.
  const [results] = await Promise.all([
    (entries ??= fetch(`${base}search.json`).then(
      (response) => response.json() as Promise<SearchEntry[]>,
    )),
    import('../../../src/command-palette.ts'),
    import('../../../src/option.ts'),
  ]);

  const palette = document.createElement('slab-command-palette');

  palette.className = 'search';
  palette.id = 'search';
  palette.label = 'Search';
  palette.hideLabel = true;
  palette.placeholder = 'Search the docs';
  palette.setAttribute('closedby', 'any');

  const options = results.map(({ href, kind, text, title }) => {
    const option = document.createElement('slab-option');
    const where = document.createElement('small');

    option.value = href;
    where.textContent = kind;
    option.append(title, ' ', where);

    haystacks.set(option, {
      text: `${kind} ${text}`.toLowerCase(),
      title: title.toLowerCase(),
    });

    return option;
  });

  const empty = document.createElement('span');

  empty.slot = 'empty';
  empty.textContent = 'Nothing matches.';

  palette.append(...options, empty);
  palette.filter = (option, query) => score(option, query) < Infinity;

  // The best matches first: the Options are put in order of how well they
  // match, and the first one becomes the active one, which Enter chooses.
  // What's typed is in `query` by the time "input" gets here.
  palette.addEventListener('input', () => {
    const { query } = palette;

    const sorted = options
      .map((option, index) => ({ index, option, score: score(option, query) }))
      .toSorted((a, b) => a.score - b.score || a.index - b.index)
      .map(({ option }) => option);

    palette.prepend(...sorted);

    void palette.updateComplete.then(() => {
      palette.activeOption =
        sorted.find((option) => score(option, query) < Infinity) ?? null;
    });
  });

  palette.addEventListener('close', () => {
    const href = palette.returnValue;

    palette.remove();

    if (href) {
      void navigate(`${base}${href}`);
    }
  });

  document.body.append(palette);

  return palette;
};

/** Opens the search, building it first if this page doesn't have it yet. */
export async function open() {
  // One build at a time, however many times it's asked for while it loads.
  building ??= build().finally(() => {
    building = undefined;
  });

  const palette =
    document.querySelector<CommandPalette>('#search') ?? (await building);

  if (!palette.open) {
    palette.showModal();
  }
}
