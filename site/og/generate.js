// Draws an Open Graph image for every page in the built site, at
// `public/og/<page>.png`, where the layout's `og:image` points. Run it when a
// page's title or description changes, with the site's `og` script, which
// builds the site first and again after:
//
//   pnpm --filter slab-site og
//
// Each card's text is read from its page, its eyebrow, its heading and its
// description, so a card can't say something its page doesn't. The images are
// committed, so the deploy needs no browser. Playwright is the repository's
// own, from its tests. What each card says is kept in `cards.json`, which
// `check.js` holds the built site to.
//
// Only cards that are missing, or whose page now says something else, are
// drawn, since a browser update alone shifts a redrawn card's pixels. To
// redraw them all after changing the card's design, build the site and run:
//
//   pnpm --filter slab-site og:generate --all

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { out, pages, record, text } from './cards.js';

const escape = (text) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

// The mark, as in `src/components/Logo.astro`: four ink courses on an ember
// one.
const mark = (ink, ember) => `
  <svg viewBox="0 0 12 6.6" xmlns="http://www.w3.org/2000/svg">
    <rect fill="${ink}" height="1.8" width="5.7" x="0" y="0" />
    <rect fill="${ink}" height="1.8" width="5.7" x="6.3" y="0" />
    <rect fill="${ink}" height="1.8" width="2.8" x="0" y="2.4" />
    <rect fill="${ink}" height="1.8" width="8.6" x="3.4" y="2.4" />
    <rect fill="${ember}" height="1.8" width="12" x="0" y="4.8" />
  </svg>`;

const card = ({ description, eyebrow, heading }) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Zilla+Slab:wght@500;600&display=block"
      rel="stylesheet"
    />
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        background-color: #e4e4df;
        color: #1c1c1c;
        display: grid;
        font-family: 'Zilla Slab', serif;
        grid-template-rows: 1fr auto;
        height: 630px;
        margin: 0;
        overflow: hidden;
        position: relative;
        width: 1200px;
      }

      main {
        display: flex;
        flex-direction: column;
        padding: 64px 80px 0;
        position: relative;
        z-index: 1;
      }

      .brand {
        align-items: center;
        display: flex;
        font-size: 44px;
        font-weight: 500;
        gap: 20px;
        letter-spacing: -0.02em;
      }

      .brand svg {
        width: 72px;
      }

      .copy {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 20px;
        justify-content: center;
        max-width: 760px;
        padding-bottom: 24px;
      }

      .eyebrow {
        align-items: center;
        color: #5c5c55;
        display: flex;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 24px;
        gap: 16px;
      }

      .eyebrow::before {
        background-color: #d9492a;
        content: '';
        height: 7px;
        width: 40px;
      }

      h1 {
        font-size: ${heading.length > 22 ? 84 : 104}px;
        font-weight: 600;
        letter-spacing: -0.035em;
        line-height: 0.98;
        margin: 0;
        text-wrap: balance;
      }

      p {
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        color: #5c5c55;
        display: -webkit-box;
        font-size: 30px;
        line-height: 1.35;
        margin: 0;
        overflow: hidden;
      }

      /*
        The mark again, large and faint, at the right edge, set a course's gap
        above the footer, as its own courses are.
      */
      .ghost {
        bottom: 117px;
        position: absolute;
        right: -60px;
        width: 400px;
      }

      .ghost svg {
        display: block;
      }

      footer {
        align-items: center;
        background-color: #1c1c1c;
        border-bottom: 14px solid #d9492a;
        color: #f2f2ef;
        display: flex;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 24px;
        padding: 26px 80px;
      }

    </style>
  </head>
  <body>
    <div class="ghost">${mark('rgb(28 28 28 / 6%)', 'rgb(217 73 42 / 22%)')}</div>
    <main>
      <div class="brand">${mark('#1c1c1c', '#d9492a')} Slab</div>
      <div class="copy">
        ${eyebrow ? `<div class="eyebrow">${escape(eyebrow)}</div>` : ''}
        <h1>${escape(heading)}</h1>
        ${description ? `<p>${escape(description)}</p>` : ''}
      </div>
    </main>
    <footer>
      <span>slab-elements.dev</span>
    </footer>
  </body>
</html>`;

const browser = await chromium.launch();
const painter = await browser.newPage({
  viewport: { height: 630, width: 1200 },
});
const all = process.argv.includes('--all');
const before = existsSync(record)
  ? JSON.parse(await readFile(record, 'utf8'))
  : {};
const drawn = {};

for (const { file, name } of await pages()) {
  drawn[name] = await text(file);

  const image = path.join(out, `${name}.png`);

  if (
    !all &&
    existsSync(image) &&
    JSON.stringify(before[name]) === JSON.stringify(drawn[name])
  ) {
    continue;
  }

  await painter.setContent(card(drawn[name]), { waitUntil: 'networkidle' });
  await painter.evaluate(() => document.fonts.ready);

  await mkdir(path.dirname(image), { recursive: true });
  await painter.screenshot({ path: image });
  console.log(`og/${name}.png`);
}

await browser.close();
await writeFile(record, `${JSON.stringify(drawn, null, 2)}\n`);
