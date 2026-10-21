import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-rating label="Label" value="2">
        <div slot="description">Description</div>
      </slab-rating>`,
  );

  await expect(page).toBeAccessible('slab-rating');
});

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-rating label="Label" max="3" value="2"></slab-rating>`,
  );

  await expect(page.locator('slab-rating')).toMatchAriaSnapshot(`
    - text: Label
    - radiogroup "Label":
      - radio "1"
      - radio "2" [checked]
      - radio "3"
  `);
});

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-rating label="Label" max="2"></slab-rating>`);

    await setProperty(page.locator('slab-rating'), 'disabled', true);

    await expect(page.locator('slab-rating')).toMatchAriaSnapshot(`
    - text: Label
    - radiogroup "Label":
      - radio "1" [disabled]
      - radio "2" [disabled]
  `);
  },
);

test(
  'required=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-rating label="Label" required></slab-rating>`,
    );

    await expect(page.getByRole('radiogroup')).toHaveAttribute(
      'aria-required',
      'true',
    );
  },
);

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-rating label="Label" max="1">
          <div slot="description">Description</div>
        </slab-rating>`,
    );

    // The description names the group rather than describing it, because
    // VoiceOver doesn't read `aria-describedby` on one.
    await expect(page.locator('slab-rating')).toMatchAriaSnapshot(`
    - text: Label
    - radiogroup "Label Description":
      - radio "1"
    - text: Description
  `);
  },
);

test(
  'shows its validity message',
  { tag: '@accessibility' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-rating label="Label" max="1" required></slab-rating>`,
    );

    const host = page.locator('slab-rating');

    await callMethod(host, 'setCustomValidity', 'Message');
    await callMethod(host, 'reportValidity');

    await expect(host).toMatchAriaSnapshot(`
    - text: Label
    - radiogroup "Label Message":
      - radio "1"
    - text: Message
  `);
  },
);
