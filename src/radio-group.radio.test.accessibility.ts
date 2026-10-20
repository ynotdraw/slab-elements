import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-radio-group-radio label="Label"></slab-radio-group-radio>`,
  );

  await expect(page).toBeAccessible('slab-radio-group-radio');
});

test(
  'sets `aria-label` when `label` is set initially',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group-radio label="Label"></slab-radio-group-radio>`,
    );

    const host = page.locator('slab-radio-group-radio');

    await expect(host).toHaveAttribute('aria-label', 'Label');
  },
);

test(
  'sets `aria-label` when `label` is set programmatically',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-radio-group-radio label="One"></slab-radio-group-radio>`,
    );

    const host = page.locator('slab-radio-group-radio');

    await setProperty(host, 'label', 'Two');

    await expect(host).toHaveAttribute('aria-label', 'Two');
  },
);

test(
  'sets `aria-checked` when checked initially',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group-radio
          label="Label"
          checked
        ></slab-radio-group-radio>`,
    );

    const host = page.locator('slab-radio-group-radio');

    await expect(host).toHaveAttribute('aria-checked', 'true');
  },
);

test(
  'sets `aria-checked` when checked programmatically',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group-radio label="Label"></slab-radio-group-radio>`,
    );

    const host = page.locator('slab-radio-group-radio');

    await setProperty(host, 'checked', true);

    await expect(host).toHaveAttribute('aria-checked', 'true');
  },
);

test(
  'sets `aria-checked` when unchecked initially',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group-radio label="Label"></slab-radio-group-radio>`,
    );

    const host = page.locator('slab-radio-group-radio');

    await expect(host).toHaveAttribute('aria-checked', 'false');
  },
);

test(
  'sets `aria-checked` when unchecked programmatically',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group-radio
          label="Label"
          checked
        ></slab-radio-group-radio>`,
    );

    const host = page.locator('slab-radio-group-radio');

    await setProperty(host, 'checked', false);

    await expect(host).toHaveAttribute('aria-checked', 'false');
  },
);

test(
  'sets `aria-disabled` when enabled initially',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group-radio label="Label"></slab-radio-group-radio>`,
    );

    const host = page.locator('slab-radio-group-radio');

    await expect(host).toHaveAttribute('aria-disabled', 'false');
  },
);

test(
  'sets `aria-disabled` when enabled programmatically',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group-radio
          label="Label"
          disabled
        ></slab-radio-group-radio>`,
    );

    const host = page.locator('slab-radio-group-radio');

    await setProperty(host, 'disabled', false);

    await expect(host).toHaveAttribute('aria-disabled', 'false');
  },
);

test(
  'sets `aria-disabled` when disabled initially',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group-radio
          label="Label"
          disabled
        ></slab-radio-group-radio>`,
    );

    const host = page.locator('slab-radio-group-radio');

    await expect(host).toHaveAttribute('aria-disabled', 'true');
  },
);

test(
  'sets `aria-disabled` when disabled programmatically',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group-radio label="Label"></slab-radio-group-radio>`,
    );

    const host = page.locator('slab-radio-group-radio');

    await setProperty(host, 'disabled', true);

    await expect(host).toHaveAttribute('aria-disabled', 'true');
  },
);
