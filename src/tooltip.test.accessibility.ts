import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Tooltip from './tooltip.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-tooltip open>
        <span>Content</span>
        <button slot="anchor">Anchor</button>
      </slab-tooltip>`,
  );

  await expect(page).toBeAccessible('slab-tooltip');
});

test('open=${true}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-tooltip close-delay="200" open-delay="300" placement="bottom">
        <span>Content</span>
        <button slot="anchor">Anchor</button>
      </slab-tooltip>`,
  );

  await page
    .locator('slab-tooltip')
    .evaluate<void, void, Tooltip>((element) => {
      element.open = true;
    });

  await expect(page.locator('slab-tooltip')).toMatchAriaSnapshot(`
    - button "Anchor"
    - tooltip "Content"
  `);

  await expect(page.getByRole('button')).toHaveAccessibleDescription('Content');
});

test('open=${false}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-tooltip close-delay="200" open-delay="300" placement="bottom">
        <span>Content</span>
        <button slot="anchor">Anchor</button>
      </slab-tooltip>`,
  );

  await expect(page.locator('slab-tooltip')).toMatchAriaSnapshot(`
    - button "Anchor"
  `);

  // Closed, it still describes the anchor, which is what a screenreader
  // user focusing it hears.
  await expect(page.getByRole('button')).toHaveAccessibleDescription('Content');
});

test('disabled', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-tooltip close-delay="200" open-delay="300" placement="bottom">
        <span>Content</span>
        <button slot="anchor">Anchor</button>
      </slab-tooltip>`,
  );

  await page
    .locator('slab-tooltip')
    .evaluate<void, void, Tooltip>((element) => {
      element.open = true;
      element.disabled = true;
    });

  await expect(page.locator('slab-tooltip')).toMatchAriaSnapshot(`
    - button "Anchor"
  `);

  await expect(page.getByRole('button')).not.toHaveAttribute(
    'aria-describedby',
  );
});
