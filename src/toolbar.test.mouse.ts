import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'makes a clicked control the tabbable one',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toolbar label="Label">
          <button>One</button>
          <button>Two</button>
        </slab-toolbar>`,
    );

    const buttons = page.locator('button');

    await buttons.nth(1).click();

    await expect(buttons.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(buttons.nth(0)).toHaveAttribute('tabindex', '-1');
  },
);
