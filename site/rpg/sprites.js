// Draws the Retro RPG showcase's pixel sprites, at `public/rpg/<name>.png`,
// from the drawings in `art.js`. Run it when a drawing changes:
//
//   pnpm --filter slab-site rpg:sprites
//
// Each drawing is shrunk to a small grid, where every pixel takes the
// commonest color of the patch it covers, so edges stay hard. Its colors are
// cut to a palette of sixteen, and a foe gets a dark outline one pixel wide.
// The page shows them scaled up with `image-rendering: pixelated`. The images
// are committed, so the deploy needs no browser. Playwright is the
// repository's own, from its tests.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { foeArt, portraits } from './art.js';

const out = path.resolve(fileURLToPath(import.meta.url), '../../public/rpg');

// Heights in pixels. The page shows each at a whole multiple of its size.
const jobs = [
  ...Object.entries(foeArt).map(([name, svg]) => ({
    colors: 16,
    height: name === 'tidewarden' ? 72 : 44,
    name,
    outline: true,
    svg,
  })),
  ...Object.entries(portraits).map(([name, svg]) => ({
    colors: 16,
    height: 32,
    name,
    outline: false,
    svg,
  })),
];

const browser = await chromium.launch();
const page = await browser.newPage();

await page.setContent('<body></body>');

const sprites = await page.evaluate(async (jobs) => {
  // How many times larger each drawing is rendered before it's shrunk.
  const scale = 8;
  const results = {};

  const distance = (a, b) =>
    (a[0] - b[0]) ** 2 * 0.3 +
    (a[1] - b[1]) ** 2 * 0.59 +
    (a[2] - b[2]) ** 2 * 0.11;

  for (const job of jobs) {
    // Auras are soft light, which a pixel grid can't hold.
    const svg = job.svg.replaceAll(
      /<(circle|ellipse)[^>]*url\(#rpg-(l-glow|t-aura)\)[^>]*\/>/g,
      '',
    );

    const image = await new Promise((resolve, reject) => {
      const element = new Image();

      element.addEventListener('load', () => resolve(element));
      element.addEventListener('error', reject);
      element.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    });

    const height = job.height;
    const width = Math.round((height * image.width) / image.height);
    const large = document.createElement('canvas');

    large.width = width * scale;
    large.height = height * scale;

    const largeContext = large.getContext('2d');

    largeContext.drawImage(image, 0, 0, large.width, large.height);

    const source = largeContext.getImageData(
      0,
      0,
      large.width,
      large.height,
    ).data;

    // Each pixel is the commonest color of its patch, or nothing when most
    // of the patch is empty.
    const pixels = Array.from({ length: width * height }, () => null);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const counts = new Map();
        let opaque = 0;

        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const index = ((y * scale + dy) * large.width + x * scale + dx) * 4;

            if (source[index + 3] < 128) {
              continue;
            }

            opaque++;

            const key =
              ((source[index] >> 3) << 10) |
              ((source[index + 1] >> 3) << 5) |
              (source[index + 2] >> 3);

            const count = counts.get(key) ?? [0, 0, 0, 0];

            count[0]++;
            count[1] += source[index];
            count[2] += source[index + 1];
            count[3] += source[index + 2];
            counts.set(key, count);
          }
        }

        if (opaque < (scale * scale) / 2) {
          continue;
        }

        const [most] = [...counts.values()].toSorted((a, b) => b[0] - a[0]);

        pixels[y * width + x] = [
          most[1] / most[0],
          most[2] / most[0],
          most[3] / most[0],
        ];
      }
    }

    // The palette starts from the colors furthest apart, so a small accent,
    // such as an eye, keeps its own, then settles on what's near each.
    const colors = pixels.filter(Boolean);
    let palette = [[...colors[0]]];

    while (palette.length < job.colors) {
      let furthest = colors[0];
      let furthestDistance = -1;

      for (const color of colors) {
        const nearest = Math.min(
          ...palette.map((entry) => distance(color, entry)),
        );

        if (nearest > furthestDistance) {
          furthestDistance = nearest;
          furthest = color;
        }
      }

      palette.push([...furthest]);
    }

    const nearestIndex = (color) => {
      let best = 0;

      for (const [index, entry] of palette.entries()) {
        if (distance(color, entry) < distance(color, palette[best])) {
          best = index;
        }
      }

      return best;
    };

    for (let pass = 0; pass < 3; pass++) {
      const sums = palette.map(() => [0, 0, 0, 0]);

      for (const color of colors) {
        const sum = sums[nearestIndex(color)];

        sum[0] += color[0];
        sum[1] += color[1];
        sum[2] += color[2];
        sum[3]++;
      }

      palette = palette.map((entry, index) =>
        sums[index][3] > 0
          ? sums[index].slice(0, 3).map((value) => value / sums[index][3])
          : entry,
      );
    }

    // The sprite, with a pixel of room on every side for a foe's outline.
    const padding = job.outline ? 1 : 0;
    const canvas = document.createElement('canvas');

    canvas.width = width + padding * 2;
    canvas.height = height + padding * 2;

    const context = canvas.getContext('2d');
    const data = context.createImageData(canvas.width, canvas.height);

    const set = (x, y, color) => {
      const index = (y * canvas.width + x) * 4;

      data.data[index] = Math.round(color[0]);
      data.data[index + 1] = Math.round(color[1]);
      data.data[index + 2] = Math.round(color[2]);
      data.data[index + 3] = 255;
    };

    const filled = (x, y) =>
      x >= 0 && y >= 0 && x < width && y < height && pixels[y * width + x];

    for (let y = -padding; y < height + padding; y++) {
      for (let x = -padding; x < width + padding; x++) {
        const pixel = filled(x, y);

        if (pixel) {
          set(x + padding, y + padding, palette[nearestIndex(pixel)]);
        } else if (
          job.outline &&
          (filled(x - 1, y) ||
            filled(x + 1, y) ||
            filled(x, y - 1) ||
            filled(x, y + 1))
        ) {
          set(x + padding, y + padding, [5, 6, 15]);
        }
      }
    }

    context.putImageData(data, 0, 0);

    results[job.name] = {
      height: canvas.height,
      url: canvas.toDataURL('image/png'),
      width: canvas.width,
    };
  }

  return results;
}, jobs);

await browser.close();
await mkdir(out, { recursive: true });

for (const [name, sprite] of Object.entries(sprites)) {
  await writeFile(
    path.join(out, `${name}.png`),
    Buffer.from(sprite.url.split(',')[1], 'base64'),
  );

  console.log(`${name}.png ${sprite.width}×${sprite.height}`);
}
