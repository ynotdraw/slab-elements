import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-sortable-list label="Label">
        <slab-sortable-list-item label="One">
          <span slot="handle">⠿</span>
          One
        </slab-sortable-list-item>
        <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
      </slab-sortable-list>`,
  );

  await expect(page).toBeAccessible('slab-sortable-list');
});

test(
  'is accessible while an item is picked up',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    await page.getByRole('button', { name: 'Reorder One' }).focus();
    await page.keyboard.press('Space');

    await expect(page).toBeAccessible('slab-sortable-list');
  },
);

test(
  'has a named list of items, each with a handle',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    await expect(page.locator('slab-sortable-list')).toMatchAriaSnapshot(`
      - list "Label":
        - listitem:
          - button "Reorder One" [pressed=false]
          - text: One
        - listitem:
          - button "Reorder Two" [pressed=false]
          - text: Two
    `);
  },
);

test(
  'describes each handle with its instructions',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    const handle = page.getByRole('button', { name: 'Reorder One' });

    await expect(handle).toHaveAccessibleDescription(
      'Press Space to pick it up. Then use the arrow keys to move it, Space to drop it, and Escape to cancel.',
    );

    await page
      .locator('slab-sortable-list')
      .evaluate((element) =>
        element.setAttribute('instructions-label', 'Instructions'),
      );

    await expect(handle).toHaveAccessibleDescription('Instructions');
  },
);

test(
  'names a handle with `handle-label`',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One" handle-label="Move One">
            One
          </slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    await expect(page.getByRole('button', { name: 'Move One' })).toBeVisible();
  },
);
