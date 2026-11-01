import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Progress from './progress.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-progress label="Label" value="0.5"></slab-progress>`,
  );

  await expect(page).toBeAccessible('slab-progress');
});

test(
  'is accessible when indeterminate with a hidden label',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-progress label="Label" hide-label></slab-progress>`,
    );

    await expect(page).toBeAccessible('slab-progress');
  },
);

test(
  'has a progressbar',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-progress label="Label" value="0.5"></slab-progress>`,
    );

    await expect(page.locator('slab-progress')).toMatchAriaSnapshot(`
    - text: Label
    - progressbar "Label"
  `);
  },
);

test(
  'reads its value through `formatValue` when set',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-progress label="Label" max="10" value="3"></slab-progress>`,
    );

    const host = page.locator('slab-progress');
    const progressbar = page.getByRole('progressbar');

    await expect(progressbar).not.toHaveAttribute('aria-valuetext');

    await host.evaluate<void, void, Progress>((element) => {
      element.formatValue = (value) => `${value} of 10 files`;
    });

    await expect(progressbar).toHaveAttribute(
      'aria-valuetext',
      '3 of 10 files',
    );

    await expect(page).toBeAccessible('slab-progress');

    // Indeterminate, there's no value to say.
    await host.evaluate<void, void, Progress>((element) => {
      element.value = undefined;
    });

    await expect(progressbar).not.toHaveAttribute('aria-valuetext');
  },
);
