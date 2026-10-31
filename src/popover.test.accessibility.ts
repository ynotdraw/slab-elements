import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Popover from './popover.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-popover open>
        <button slot="anchor">Anchor</button>
        Content
      </slab-popover>`,
  );

  await expect(page).toBeAccessible('slab-popover');
});

test('open=${false}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-popover placement="bottom">
        <button slot="anchor">Anchor</button>
        Content
      </slab-popover>`,
  );

  await expect(page.locator('slab-popover')).toMatchAriaSnapshot(`
    - button "Anchor" [expanded=false]
  `);
});

test('open=${true}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-popover placement="bottom">
        <button slot="anchor">Anchor</button>
        Content
      </slab-popover>`,
  );

  await page
    .locator('slab-popover')
    .evaluate<void, void, Popover>((element) => {
      element.open = true;
    });

  await expect(page.locator('slab-popover')).toMatchAriaSnapshot(`
    - button "Anchor" [expanded]
    - text: Content
  `);
});

test(
  'is accessible with `label`',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-popover label="Label" open>
          <button slot="anchor">Anchor</button>
          Content
        </slab-popover>`,
    );

    await expect(page).toBeAccessible('slab-popover');
  },
);

test('label="Label"', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-popover label="Label">
        <button slot="anchor">Anchor</button>
        Content
      </slab-popover>`,
  );

  await page
    .locator('slab-popover')
    .evaluate<void, void, Popover>((element) => {
      element.open = true;
    });

  // Playwright's ARIA snapshots leave out `aria-haspopup`.
  await expect(page.locator('slab-popover')).toMatchAriaSnapshot(`
    - button "Anchor" [expanded]
    - dialog "Label": Content
  `);

  await expect(page.getByRole('button')).toHaveAttribute(
    'aria-haspopup',
    'dialog',
  );
});

test(
  'is a dialog only while it has a `label`',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-popover open>
          <button slot="anchor">Anchor</button>
          Content
        </slab-popover>`,
    );

    const host = page.locator('slab-popover');
    const anchor = page.getByRole('button');

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(anchor).not.toHaveAttribute('aria-haspopup');

    await setProperty(host, 'label', 'Label');

    await expect(page.getByRole('dialog', { name: 'Label' })).toBeVisible();
    await expect(anchor).toHaveAttribute('aria-haspopup', 'dialog');

    await setProperty(host, 'label', undefined);

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(anchor).not.toHaveAttribute('aria-haspopup');
  },
);
