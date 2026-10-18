import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'is accessible',
  { tag: '@accessibility' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`<slab-toggle-group-button>Label</slab-toggle-group-button>`,
    );

    await expect(page).toBeAccessible('slab-toggle-group-button');
  },
);

test(
  'is a button that says whether it is pressed',
  { tag: '@accessibility' },
  async ({ renderTemplate, page, setProperty }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group-button pressed
          >Label</slab-toggle-group-button
        >`,
    );

    const host = page.locator('slab-toggle-group-button');

    await expect(host).toMatchAriaSnapshot(`
      - button "Label" [pressed]
    `);

    await setProperty(host, 'pressed', false);

    await expect(host).toMatchAriaSnapshot(`
      - button "Label" [pressed=false]
    `);
  },
);

test(
  'sets `aria-disabled` when disabled',
  { tag: '@accessibility' },
  async ({ renderTemplate, page, setProperty }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group-button disabled
          >Label</slab-toggle-group-button
        >`,
    );

    const host = page.locator('slab-toggle-group-button');

    await expect(host).toHaveAttribute('aria-disabled', 'true');

    await setProperty(host, 'disabled', false);

    await expect(host).toHaveAttribute('aria-disabled', 'false');
  },
);

test(
  'sets `aria-label` from `label`, and removes it when `label` is',
  { tag: '@accessibility' },
  async ({ renderTemplate, page, setProperty }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group-button label="Bold">
          <svg aria-hidden="true"></svg>
        </slab-toggle-group-button>`,
    );

    const host = page.locator('slab-toggle-group-button');

    await expect(host).toHaveAttribute('aria-label', 'Bold');

    await setProperty(host, 'label', undefined);

    await expect(host).not.toHaveAttribute('aria-label');
  },
);
