import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-toggle-button>Bold</slab-toggle-button>`);

  await expect(page).toBeAccessible('slab-toggle-button');
});

test(
  'is accessible when pressed',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-toggle-button pressed>Bold</slab-toggle-button>`,
    );

    await expect(page).toBeAccessible('slab-toggle-button');
  },
);

test(
  'is a button that says whether it is pressed',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-toggle-button pressed>Bold</slab-toggle-button>`,
    );

    const host = page.locator('slab-toggle-button');

    await expect(host).toMatchAriaSnapshot(`
      - button "Bold" [pressed]
    `);

    await setProperty(host, 'pressed', false);

    await expect(host).toMatchAriaSnapshot(`
      - button "Bold" [pressed=false]
    `);
  },
);

test(
  'is named by `label` when it is set',
  { tag: '@accessibility' },
  async ({ render, page, removeAttribute }) => {
    await render(
      () =>
        html`<slab-toggle-button label="Mute"
          ><span aria-hidden="true">🔇</span></slab-toggle-button
        >`,
    );

    await expect(page.getByRole('button', { name: 'Mute' })).toBeVisible();

    await removeAttribute(page.locator('slab-toggle-button'), 'label');

    await expect(page.locator('button')).not.toHaveAttribute('aria-label');
  },
);

test('disabled', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-toggle-button disabled>Bold</slab-toggle-button>`,
  );

  await expect(page.getByRole('button', { name: 'Bold' })).toBeDisabled();
});
