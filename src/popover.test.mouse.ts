import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'opens and closes when its anchor is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-popover>
          <button slot="anchor">Anchor</button>
          Content
        </slab-popover>`,
    );

    const host = page.locator('slab-popover');
    const anchor = page.getByRole('button');

    await anchor.click();

    await expect(host).toHaveAttribute('open');
    await expect(anchor).toHaveAttribute('aria-expanded', 'true');

    // A click on the anchor isn't a click outside the popover, so it isn't
    // dismissed first and then opened again.
    await anchor.click();

    await expect(host).not.toHaveAttribute('open');
    await expect(anchor).toHaveAttribute('aria-expanded', 'false');
  },
);

test(
  'closes when something outside it is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div>
          <button>Outside</button>

          <slab-popover open>
            <button slot="anchor">Anchor</button>
            Content
          </slab-popover>
        </div>`,
    );

    await page.getByRole('button', { name: 'Outside' }).click();

    await expect(page.locator('slab-popover')).not.toHaveAttribute('open');
    await expect(page.locator('[data-test="popover"]')).toBeHidden();
  },
);

test(
  'stays open when its content is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-popover open>
          <button slot="anchor">Anchor</button>
          <p>Content</p>
        </slab-popover>`,
    );

    // Slotted, so it's outside the popover's own tree. The platform still
    // counts it as inside for light dismiss, because it's inside in the flat
    // tree.
    await page.getByText('Content').click();

    await expect(page.locator('slab-popover')).toHaveAttribute('open');
  },
);
