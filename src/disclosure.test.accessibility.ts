import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Disclosure from './disclosure.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-disclosure label="Label" open>Content</slab-disclosure>`,
  );

  await expect(page).toBeAccessible('slab-disclosure');
});

test('open=${true}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-disclosure label="Label">Content</slab-disclosure>`,
  );

  await page
    .locator('slab-disclosure')
    .evaluate<void, void, Disclosure>((element) => {
      element.open = true;
    });

  // Browsers expose a `<summary>` as a button, but it has no ARIA role of its
  // own, so Playwright's tree reads it as text. Its expanded state is the
  // browser's to report and isn't in the snapshot for the same reason.
  await expect(page.locator('slab-disclosure')).toMatchAriaSnapshot(`
    - group: Label Content
  `);
});

test('open=${false}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-disclosure label="Label">Content</slab-disclosure>`,
  );

  // Closed content isn't rendered, so it isn't in the tree.
  await expect(page.locator('slab-disclosure')).toMatchAriaSnapshot(`
    - group: Label
  `);
});

test(
  'is accessible with `heading-level`',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-disclosure label="Label" heading-level="3" open
          >Content</slab-disclosure
        >`,
    );

    await expect(page).toBeAccessible('slab-disclosure');
  },
);

test(
  'heading-level="3"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-disclosure label="Label" heading-level="3"
          >Content</slab-disclosure
        >`,
    );

    await expect(page.locator('slab-disclosure')).toMatchAriaSnapshot(`
      - group:
        - heading "Label" [level=3]
    `);
  },
);

test(
  'ignores a `heading-level` that is not one',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-disclosure label="Label">Content</slab-disclosure>`,
    );

    // Set here because lit-analyzer only knows 1 through 6.
    await page.locator('slab-disclosure').evaluate((element) => {
      element.setAttribute('heading-level', '7');
    });

    await expect(page.getByRole('heading')).toHaveCount(0);

    await page
      .locator('slab-disclosure')
      .evaluate<void, void, Disclosure>((element) => {
        element.headingLevel = 2;
      });

    await expect(page.getByRole('heading', { level: 2 })).toHaveText('Label');
  },
);
