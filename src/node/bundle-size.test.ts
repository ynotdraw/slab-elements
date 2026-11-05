import { readdir, rm, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { build, type Rollup } from 'vite';
import { expect, test } from '../playwright/test.js';

// Each element on its own, bundled and minified the way an app would ship
// it, and gzipped. Lit isn't counted, since it's a peer dependency an app
// has anyway. A budget rather than exact sizes, so a small change doesn't
// fail it, but a big one, such as a dependency pulled in by mistake, does.
//
// Raise a budget on purpose, in the same pull request as what needs it.
const budget = {
  // Combobox, the largest, was about 15 KB when this was written.
  element: 18_000,

  // Every element together, sharing what they share. About 89 KB for 79
  // elements when this was written, so a new element may need it raised.
  total: 100_000,
};

const directory = new URL('../../dist/', import.meta.url);

async function size(entry: string) {
  // An app build rather than library mode, which leaves whitespace in.
  const result = await build({
    build: {
      minify: 'esbuild',
      modulePreload: false,
      rollupOptions: {
        external: [/^lit($|\/)/, /^@lit\//],
        input: entry,
        preserveEntrySignatures: 'strict',
      },
      write: false,
    },
    configFile: false,
    logLevel: 'silent',
  });

  const [output] = Array.isArray(result) ? result : [result];

  const code = (output as Rollup.RollupOutput).output
    .filter((chunk) => chunk.type === 'chunk')
    .map((chunk) => chunk.code)
    .join('');

  return gzipSync(code, { level: 9 }).byteLength;
}

test(
  'keeps each element and every element together within budget',
  { tag: '@miscellaneous' },
  async () => {
    const files = await readdir(directory);

    const elements = files.filter((file) => {
      return (
        file.endsWith('.js') &&
        !file.includes('.test.') &&
        !file.includes('.stories.') &&
        !file.includes('.styles.') &&
        !['jsx.js', 'react.js', 'svelte.js', 'vue.js'].includes(file)
      );
    });

    expect(elements.length).toBeGreaterThan(0);

    const sizes = new Map<string, number>();

    for (const element of elements) {
      sizes.set(element, await size(new URL(element, directory).pathname));
    }

    const oversized = [...sizes].filter(([, bytes]) => bytes > budget.element);

    expect(oversized).toStrictEqual([]);

    const all = new URL('all.js', directory);

    await writeFile(
      all,
      elements.map((element) => `import './${element}';`).join('\n'),
    );

    try {
      expect(await size(all.pathname)).toBeLessThanOrEqual(budget.total);
    } finally {
      await rm(all);
    }
  },
);
