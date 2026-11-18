// Fails when a page's link preview card is missing, or was drawn from text
// the page no longer has, so a page can't ship with no card or a stale one.
// Run on the built site, with the site's `og:check` script:
//
//   pnpm --filter slab-site og:check
//
// It reads the built pages and compares them with `cards.json`, which
// `generate.js` writes as it draws, so it needs no browser.

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { out, pages, record, text } from './cards.js';

const drawn = existsSync(record)
  ? JSON.parse(await readFile(record, 'utf8'))
  : {};
const problems = [];

for (const { file, name } of await pages()) {
  const image = path.join(out, `${name}.png`);

  if (!existsSync(image) || !drawn[name]) {
    problems.push(`${name}: no card`);
  } else if (JSON.stringify(drawn[name]) !== JSON.stringify(await text(file))) {
    problems.push(`${name}: the card's text is out of date`);
  }
}

if (problems.length > 0) {
  console.error(
    [
      'Link preview cards need drawing:',
      ...problems.map((problem) => `  ${problem}`),
      '',
      'Run `pnpm --filter slab-site og` and commit the changes in site/public/og and site/og/cards.json.',
    ].join('\n'),
  );

  process.exitCode = 1;
}
