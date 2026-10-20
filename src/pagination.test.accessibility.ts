import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-pagination total="10" page="5"></slab-pagination>`,
  );

  await expect(page).toBeAccessible('slab-pagination');
});

test(
  'has a navigation',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pagination
          page="1"
          siblings="1"
          total="10"
        ></slab-pagination>`,
    );

    await expect(page.locator('slab-pagination')).toMatchAriaSnapshot(`
    - navigation "Pagination":
      - list:
        - listitem:
          - button "Previous" [disabled]
        - listitem:
          - button "Page 1": "1"
        - listitem:
          - button "Page 2": "2"
        - listitem:
          - button "Page 3": "3"
        - listitem:
          - button "Page 4": "4"
        - listitem:
          - button "Page 5": "5"
        - listitem: …
        - listitem:
          - button "Page 10": "10"
        - listitem:
          - button "Next"
  `);
  },
);

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-pagination
        label="Label"
        page="1"
        siblings="1"
        total="10"
      ></slab-pagination>`,
  );

  await expect(page.locator('slab-pagination')).toMatchAriaSnapshot(`
    - navigation "Label"
  `);
});

test(
  'next-label, previous-label and pageLabel',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pagination
          next-label="Suivant"
          previous-label="Précédent"
          total="1"
          .pageLabel=${(page: number) => `Page ${page} sur 1`}
        ></slab-pagination>`,
    );

    await expect(page.locator('slab-pagination')).toMatchAriaSnapshot(`
      - navigation "Pagination":
        - list:
          - listitem:
            - button "Précédent" [disabled]
          - listitem:
            - button "Page 1 sur 1": "1"
          - listitem:
            - button "Suivant" [disabled]
    `);
  },
);
