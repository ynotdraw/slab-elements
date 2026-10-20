import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'closes the others when one is opened via Enter and `exclusive`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-accordion exclusive>
          <slab-disclosure label="One" open>One</slab-disclosure>
          <slab-disclosure label="Two">Two</slab-disclosure>
        </slab-accordion>`,
    );

    await page.locator('summary').last().press('Enter');

    const disclosures = page.locator('slab-disclosure');

    await expect(disclosures.first()).toHaveJSProperty('open', false);
    await expect(disclosures.last()).toHaveJSProperty('open', true);
  },
);

// Arrow keys are optional in the APG's accordion, and Slab leaves them out.
// Tab already reaches each summary, and the content in between.
test(
  'moves between summaries via Tab',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-accordion>
          <slab-disclosure label="One">One</slab-disclosure>
          <slab-disclosure label="Two">Two</slab-disclosure>
        </slab-accordion>`,
    );

    await page.keyboard.press('Tab');
    await expect(page.locator('summary').first()).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('summary').last()).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(page.locator('summary').last()).toBeFocused();
  },
);
