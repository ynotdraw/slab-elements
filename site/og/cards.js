// What each page's link preview card says, read from the built site, so the
// card can't say something its page doesn't. Shared by `generate.js`, which
// draws the cards, and `check.js`, which fails when one is missing or stale.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

export const site = path.resolve(fileURLToPath(import.meta.url), '../..');
export const dist = path.join(site, 'dist');

// The cards, at `public/og/<page>.png`, where the layout's `og:image` points.
export const out = path.join(site, 'public/og');

// The text every card was drawn from, by page. `check.js` compares the built
// site against it.
export const record = path.join(site, 'og/cards.json');

// Every built page: `dist/index.html` is "index", and
// `dist/components/alert/index.html` is "components/alert".
export async function pages(directory = dist) {
  const found = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);

    if (entry.isDirectory() && entry.name !== '_astro' && entry.name !== 'og') {
      found.push(...(await pages(file)));
    } else if (entry.name === 'index.html') {
      const route = path.relative(dist, directory);
      found.push({ file, name: route === '' ? 'index' : route });
    }
  }

  return found.sort((a, b) => a.name.localeCompare(b.name));
}

// A card's eyebrow, heading and description, from its page.
export async function text(file) {
  const document = parse(await readFile(file, 'utf8'));
  const main = document.querySelector('main');
  const heading = main?.querySelector('h1');

  // A line break in a heading is a space on the card, which sets its own.
  for (const br of heading?.querySelectorAll('br') ?? []) {
    br.replaceWith(' ');
  }

  const card = {
    description:
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content') ?? '',
    eyebrow: main?.querySelector('.eyebrow')?.textContent.trim() ?? '',
    heading: heading?.textContent.replaceAll(/\s+/g, ' ').trim() ?? '',
  };

  // The home page's description opens with its eyebrow, which the card
  // already shows.
  if (card.eyebrow && card.description.startsWith(`${card.eyebrow}. `)) {
    card.description = card.description.slice(card.eyebrow.length + 2);
  }

  return card;
}
