import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<div role="listbox" aria-label="Label">
        <slab-option>Label</slab-option>
      </div>`,
  );

  await expect(page).toBeAccessible('slab-option');
});

test(
  'is named by its text',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-option>Label</slab-option>`);

    await expect(page.getByRole('option')).toHaveAccessibleName('Label');
  },
);

test(
  'sets `aria-label` when `label` is set initially',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-option label="Label">Text</slab-option>`);

    const host = page.locator('slab-option');

    await expect(host).toHaveAttribute('aria-label', 'Label');
  },
);

test(
  'sets `aria-label` when `label` is set programmatically',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-option label="One">Text</slab-option>`);

    const host = page.locator('slab-option');

    await setProperty(host, 'label', 'Two');

    await expect(host).toHaveAttribute('aria-label', 'Two');
  },
);

test(
  'removes `aria-label` when `label` is removed programmatically',
  { tag: '@accessibility' },
  async ({ removeAttribute, render, page }) => {
    await render(() => html`<slab-option label="One">Text</slab-option>`);

    const host = page.locator('slab-option');

    await removeAttribute(host, 'label');

    await expect(host).not.toHaveAttribute('aria-label');
    await expect(page.getByRole('option')).toHaveAccessibleName('Text');
  },
);

test(
  'sets `aria-selected` when selected initially',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-option selected>Label</slab-option>`);

    const host = page.locator('slab-option');

    await expect(host).toHaveAttribute('aria-selected', 'true');
  },
);

test(
  'sets `aria-selected` when selected programmatically',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-option>Label</slab-option>`);

    const host = page.locator('slab-option');

    await setProperty(host, 'selected', true);

    await expect(host).toHaveAttribute('aria-selected', 'true');
  },
);

test(
  'sets `aria-selected` when deselected programmatically',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-option selected>Label</slab-option>`);

    const host = page.locator('slab-option');

    await setProperty(host, 'selected', false);

    await expect(host).toHaveAttribute('aria-selected', 'false');
  },
);

test(
  'sets `aria-disabled` when enabled initially',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-option>Label</slab-option>`);

    const host = page.locator('slab-option');

    await expect(host).toHaveAttribute('aria-disabled', 'false');
  },
);

test(
  'sets `aria-disabled` when disabled initially',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-option disabled>Label</slab-option>`);

    const host = page.locator('slab-option');

    await expect(host).toHaveAttribute('aria-disabled', 'true');
  },
);

test(
  'sets `aria-disabled` when disabled programmatically',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-option>Label</slab-option>`);

    const host = page.locator('slab-option');

    await setProperty(host, 'disabled', true);

    await expect(host).toHaveAttribute('aria-disabled', 'true');
  },
);
