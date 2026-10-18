import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type ToggleGroup from './toggle-group.js';

test(
  'is accessible',
  { tag: '@accessibility' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <slab-toggle-group label="Label">
          <button aria-pressed="true" value="one">One</button>
          <button disabled value="two">Two</button>
        </slab-toggle-group>
      `,
    );

    await expect(page).toBeAccessible('slab-toggle-group');
  },
);

test(
  'is accessible when vertical',
  { tag: '@accessibility' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <slab-toggle-group label="Label" orientation="vertical">
          <button value="one">One</button>
        </slab-toggle-group>
      `,
    );

    await expect(page).toBeAccessible('slab-toggle-group');
  },
);

test('has a group', { tag: '@accessibility' }, async ({ page }) => {
  await page.goto('?id=toggle-group--toggle-group');

  await expect(page.locator('slab-toggle-group')).toMatchAriaSnapshot(`
    - group "Label":
      - button "One" [pressed=false]
      - button "Two" [pressed=false]
      - button "Three" [pressed=false]
  `);
});

test('multiple=${true}', { tag: '@accessibility' }, async ({ page }) => {
  await page.goto('?id=toggle-group--toggle-group');

  await page
    .locator('slab-toggle-group')
    .evaluate<void, void, ToggleGroup>((element) => {
      element.multiple = true;
      element.values = ['one', 'three'];
    });

  await expect(page.locator('slab-toggle-group')).toMatchAriaSnapshot(`
    - group "Label":
      - button "One" [pressed]
      - button "Two" [pressed=false]
      - button "Three" [pressed]
  `);
});
