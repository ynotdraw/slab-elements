import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type FileDrop from './file-drop.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-file-drop label="Label">
        <div slot="description">Description</div>
      </slab-file-drop>`,
  );

  await expect(page).toBeAccessible('slab-file-drop');
});

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-file-drop label="Label"></slab-file-drop>`);

  await expect(page.locator('slab-file-drop')).toMatchAriaSnapshot(`
    - button "Label"
  `);
});

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-file-drop label="Label"></slab-file-drop>`);

    await page
      .locator('slab-file-drop')
      .evaluate<void, void, FileDrop>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-file-drop')).toMatchAriaSnapshot(`
    - button "Label" [disabled]
  `);
  },
);

test('required', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-file-drop label="Label"></slab-file-drop>`);

  await page
    .locator('slab-file-drop')
    .evaluate<void, void, FileDrop>((element) => {
      element.required = true;
    });

  await expect(page.locator('slab-file-drop')).toMatchAriaSnapshot(`
    - button "Label"
  `);
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-file-drop label="Label"></slab-file-drop>`);

    await page.locator('slab-file-drop').evaluate((element) => {
      const description = document.createElement('div');

      description.slot = 'description';
      description.textContent = 'Description';
      element.append(description);
    });

    await expect(page.locator('slab-file-drop')).toMatchAriaSnapshot(`
    - button "Label"
    - text: Description
  `);
  },
);
