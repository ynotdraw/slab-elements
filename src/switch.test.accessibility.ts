import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Switch from './switch.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-switch label="Label">
        <div slot="description">Description</div>
      </slab-switch>`,
  );

  await expect(page).toBeAccessible('slab-switch');
});

test('checked=${true}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-switch label="Label" value="on"></slab-switch>`,
  );

  await page.locator('slab-switch').evaluate<void, void, Switch>((element) => {
    element.checked = true;
  });

  await expect(page.locator('slab-switch')).toMatchAriaSnapshot(`
    - text: Label
    - switch "Label" [checked]
  `);
});

test(
  'checked=${false}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-switch label="Label" value="on"></slab-switch>`,
    );

    await expect(page.locator('slab-switch')).toMatchAriaSnapshot(`
    - text: Label
    - switch "Label"
  `);
  },
);

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-switch label="Label" value="on"></slab-switch>`,
    );

    await page
      .locator('slab-switch')
      .evaluate<void, void, Switch>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-switch')).toMatchAriaSnapshot(`
    - text: Label
    - switch "Label" [disabled]
  `);
  },
);

test('hide-label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-switch label="Label" value="on"></slab-switch>`,
  );

  await page.locator('slab-switch').evaluate<void, void, Switch>((element) => {
    element.hideLabel = true;
  });

  // Hidden visually, so it still names the switch.
  await expect(page.locator('slab-switch')).toMatchAriaSnapshot(`
    - text: Label
    - switch "Label"
  `);
});

test('required', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-switch label="Label" value="on"></slab-switch>`,
  );

  await page.locator('slab-switch').evaluate<void, void, Switch>((element) => {
    element.required = true;
  });

  await expect(page.locator('slab-switch')).toMatchAriaSnapshot(`
    - text: Label
    - switch "Label"
  `);
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-switch label="Label" value="on"></slab-switch>`,
    );

    await page
      .locator('slab-switch')
      .evaluate<void, void, Switch>((element) => {
        const div = document.createElement('div');

        div.textContent = 'Description';
        div.slot = 'description';

        element.append(div);
      });

    await expect(page.locator('slab-switch')).toMatchAriaSnapshot(`
    - text: Label
    - switch "Label"
    - text: Description
  `);
  },
);
