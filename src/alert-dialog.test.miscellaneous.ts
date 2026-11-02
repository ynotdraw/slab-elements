import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () => html`<slab-alert-dialog label="Label"></slab-alert-dialog>`,
  );

  await expect(
    page.locator('slab-alert-dialog'),
  ).toBeInTheCustomElementRegistry('slab-alert-dialog');
});

test(
  'opens as a modal when `open` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-alert-dialog label="Label" open></slab-alert-dialog>`,
    );

    await expect(page.locator('[data-test="dialog"]:modal')).toBeVisible();

    await expect(page.getByTestId('dialog')).toHaveAttribute(
      'role',
      'alertdialog',
    );
  },
);

test(
  'treats `closedby="any"` as "closerequest"',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-alert-dialog closedby="any" label="Label" open>
        </slab-alert-dialog>`,
    );

    await expect(page.locator('slab-alert-dialog')).toHaveAttribute(
      'closedby',
      'closerequest',
    );

    await expect(page.getByTestId('dialog')).toHaveAttribute(
      'closedby',
      'closerequest',
    );
  },
);

test(
  'passes `closedby="none"` to its dialog',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-alert-dialog closedby="none" label="Label" open>
        </slab-alert-dialog>`,
    );

    await expect(page.getByTestId('dialog')).toHaveAttribute(
      'closedby',
      'none',
    );
  },
);

test(
  'takes up a new `cancel-label`',
  { tag: '@miscellaneous' },
  async ({ render, setProperty, page }) => {
    await render(
      () => html`<slab-alert-dialog label="Label" open></slab-alert-dialog>`,
    );

    await expect(page.getByTestId('cancel')).toHaveText('Cancel');

    await setProperty(
      page.locator('slab-alert-dialog'),
      'cancelLabel',
      'Keep it',
    );

    await expect(page.getByTestId('cancel')).toHaveText('Keep it');
  },
);
