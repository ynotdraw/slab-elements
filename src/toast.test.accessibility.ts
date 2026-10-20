import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Toast from './toast.js';

test(
  'is accessible',
  { tag: '@accessibility' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-toast duration="0">Changes saved</slab-toast>`,
    );

    await callMethod(page.locator('slab-toast'), 'show');

    await expect(page).toBeAccessible('slab-toast');
  },
);

test('open', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-toast duration="5000">Changes saved</slab-toast>`,
  );

  await page
    .locator('slab-toast')
    .evaluate<Promise<void>, void, Toast>((element) => {
      element.duration = 0;
      return element.show();
    });

  await expect(page.locator('slab-toast')).toMatchAriaSnapshot(`
    - status: Changes saved
  `);
});

// Empty but still there, so screenreaders already know about it when the
// next `show()` puts something in it.
test('dismissed', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-toast duration="5000">Changes saved</slab-toast>`,
  );

  await expect(page.locator('slab-toast')).toMatchAriaSnapshot(`
    - status
  `);
});
