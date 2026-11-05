import { readdir } from 'node:fs/promises';
import { expect, test } from '../playwright/test.js';

// Frameworks that render on a server, such as Next.js, Astro and SvelteKit,
// import a page's modules there even when the elements only render in the
// browser. So nothing at a module's top level can need `window`, `document`
// or `location`, which a server doesn't have. Lit brings stand-ins for
// `HTMLElement` and `customElements` there.
//
// It imports the compiled elements from `./dist`, the way a consumer does,
// so it runs in Node.js with the lint rules' tests, after `tsc`, rather than
// in a browser.
test(
  'imports every element in Node.js, where there is no `window`',
  { tag: '@miscellaneous' },
  async () => {
    expect('window' in globalThis).toBe(false);

    const directory = new URL('../../dist/', import.meta.url);

    const files = await readdir(directory);

    const modules = files.filter((file) => {
      return (
        file.endsWith('.js') &&
        !file.includes('.test.') &&
        !file.includes('.stories.') &&
        !file.includes('.styles.')
      );
    });

    expect(modules.length).toBeGreaterThan(0);

    for (const module of modules) {
      await expect(
        import(new URL(module, directory).href),
        module,
      ).resolves.toBeDefined();
    }
  },
);
