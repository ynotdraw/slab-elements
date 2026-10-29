import { html } from 'lit';
import { expect, test } from '../playwright/test.js';
import type { Strings } from './strings.js';

// In a variable rather than written inline: TypeScript resolves a literal
// specifier as a module, and this is a path the dev server serves rather than
// one TypeScript can resolve.
const stringsPath = '/src/strings.ts';

type Register = (lang: string, strings: Partial<Strings>) => void;

const register = (
  page: import('@playwright/test').Page,
  lang: string,
  strings: Partial<Strings>,
) => {
  return page.evaluate(
    async ([path, lang, strings]) => {
      const { registerStrings } = (await import(path)) as {
        registerStrings: Register;
      };

      registerStrings(lang, strings);
    },
    [stringsPath, lang, strings] as const,
  );
};

test(
  'says its strings in English',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-alert dismissible>Saved</slab-alert>`);

    await expect(page.getByRole('button')).toHaveText('Dismiss');
  },
);

test(
  'takes up strings registered for its language after it renders',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div lang="fr">
          <slab-alert dismissible>Enregistré</slab-alert>
        </div>`,
    );

    await expect(page.getByRole('button')).toHaveText('Dismiss');

    await register(page, 'fr', { alertDismiss: 'Fermer' });

    await expect(page.getByRole('button')).toHaveText('Fermer');
  },
);

test(
  "takes a region's language's strings, and then the language's",
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div lang="FR-ca">
            <slab-pagination label="Pages" total="3"></slab-pagination>
          </div>
          <div lang="fr">
            <slab-pagination label="Pages" total="3"></slab-pagination>
          </div>`,
    );

    await register(page, 'fr', {
      paginationNext: 'Suivant',
      paginationPrevious: 'Précédent',
    });

    await register(page, 'fr-CA', { paginationNext: 'Prochain' });

    const canadian = page.locator('slab-pagination').nth(0);
    const french = page.locator('slab-pagination').nth(1);

    // What a region leaves out is its language's, and what that leaves out
    // is English.
    await expect(
      canadian.getByRole('button', { name: 'Prochain' }),
    ).toBeVisible();

    await expect(
      canadian.getByRole('button', { name: 'Précédent' }),
    ).toBeVisible();

    await expect(
      canadian.getByRole('button', { name: 'Page 1' }),
    ).toBeVisible();

    await expect(french.getByRole('button', { name: 'Suivant' })).toBeVisible();
  },
);

test(
  'adds to the strings already registered for a language',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div lang="de">
          <slab-pagination label="Seiten" total="3"></slab-pagination>
        </div>`,
    );

    await register(page, 'de', { paginationNext: 'Weiter' });
    await register(page, 'de', { paginationPrevious: 'Zurück' });

    await expect(page.getByRole('button', { name: 'Weiter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zurück' })).toBeVisible();
  },
);

test(
  'finds its language through shadow roots',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div lang="es" data-test="host"></div>
          <slab-alert dismissible>Guardado</slab-alert>`,
    );

    await page.locator('[data-test="host"]').evaluate((host) => {
      const root = host.attachShadow({ mode: 'open' });
      const alert = document.querySelector('slab-alert');

      if (alert) {
        root.append(alert);
      }
    });

    await register(page, 'es', { alertDismiss: 'Descartar' });

    await expect(page.getByRole('button')).toHaveText('Descartar');
  },
);

test(
  'prefers what is set on the element',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div lang="fr">
          <slab-alert dismiss-label="Masquer" dismissible
            >Enregistré</slab-alert
          >
        </div>`,
    );

    await register(page, 'fr', { alertDismiss: 'Fermer' });

    await expect(page.getByRole('button')).toHaveText('Masquer');
  },
);

test(
  'stops listening for strings once it leaves the page',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div lang="it">
          <slab-alert dismissible>Salvato</slab-alert>
        </div>`,
    );

    // Kept, once it's removed, to read from after.
    await page.locator('slab-alert').evaluate((element) => {
      Object.assign(globalThis, { removed: element });
      element.remove();
    });

    await register(page, 'it', { alertDismiss: 'Chiudi' });

    // Not rendered again while it was away, so it still says what it did.
    const text = await page.evaluate(() => {
      const { removed } = globalThis as unknown as { removed: Element };
      return removed.shadowRoot?.querySelector('button')?.textContent?.trim();
    });

    expect(text).toBe('Dismiss');
  },
);
