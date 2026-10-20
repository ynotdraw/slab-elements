import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'closes the others when one is opened via click and `exclusive`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-accordion exclusive>
          <slab-disclosure label="One">One</slab-disclosure>
          <slab-disclosure label="Two">Two</slab-disclosure>
          <slab-disclosure label="Three">Three</slab-disclosure>
        </slab-accordion>`,
    );

    const disclosures = page.locator('slab-disclosure');

    await page.locator('summary').first().click();
    await expect(disclosures.first()).toHaveJSProperty('open', true);

    await page.locator('summary').nth(1).click();

    await expect(disclosures.nth(0)).toHaveJSProperty('open', false);
    await expect(disclosures.nth(1)).toHaveJSProperty('open', true);
    await expect(disclosures.nth(2)).toHaveJSProperty('open', false);

    await expect(page.locator('details').first()).toHaveJSProperty(
      'open',
      false,
    );
  },
);

test(
  'can close the open one when `exclusive`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-accordion exclusive>
          <slab-disclosure label="One" open>One</slab-disclosure>
          <slab-disclosure label="Two">Two</slab-disclosure>
        </slab-accordion>`,
    );

    await page.locator('summary').first().click();

    // Exclusive means at most one open, not always one.
    await expect(page.locator('slab-disclosure').first()).toHaveJSProperty(
      'open',
      false,
    );
  },
);

test(
  'leaves the others open when not `exclusive`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-accordion>
          <slab-disclosure label="One" open>One</slab-disclosure>
          <slab-disclosure label="Two">Two</slab-disclosure>
        </slab-accordion>`,
    );

    await page.locator('summary').last().click();

    const disclosures = page.locator('slab-disclosure');

    await expect(disclosures.first()).toHaveJSProperty('open', true);
    await expect(disclosures.last()).toHaveJSProperty('open', true);
  },
);
