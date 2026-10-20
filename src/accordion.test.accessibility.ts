import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-accordion exclusive>
        <slab-disclosure label="One" open>One</slab-disclosure>
        <slab-disclosure label="Two">Two</slab-disclosure>
      </slab-accordion>`,
  );

  await expect(page).toBeAccessible('slab-accordion');
});

test(
  'exclusive=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-accordion exclusive>
          <slab-disclosure label="One">One</slab-disclosure>
          <slab-disclosure label="Two">Two</slab-disclosure>
          <slab-disclosure label="Three">Three</slab-disclosure>
        </slab-accordion>`,
    );

    await page.locator('summary').first().click();
    await page.locator('summary').last().click();

    // Accordion adds no role of its own. It's its Disclosures, and a `<summary>`
    // reads as text to Playwright's tree, as in Disclosure's snapshots.
    await expect(page.locator('slab-accordion')).toMatchAriaSnapshot(`
    - group: One
    - group: Two
    - group: Three Three
  `);
  },
);

test(
  'exclusive=${false}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-accordion>
          <slab-disclosure label="One">One</slab-disclosure>
          <slab-disclosure label="Two">Two</slab-disclosure>
          <slab-disclosure label="Three">Three</slab-disclosure>
        </slab-accordion>`,
    );

    await page.locator('summary').first().click();
    await page.locator('summary').last().click();

    await expect(page.locator('slab-accordion')).toMatchAriaSnapshot(`
      - group: One One
      - group: Two
      - group: Three Three
    `);
  },
);
