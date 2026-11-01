import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Rating from './rating.js';

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

test('step="0.5"', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-rating
        label="Label"
        max="2"
        step="0.5"
        value="1.5"
      ></slab-rating>`,
  );

  await expect(page.locator('slab-rating')).toMatchAriaSnapshot(`
    - text: Label
    - radiogroup "Label":
      - radio "0.5"
      - radio "1"
      - radio "1.5" [checked]
      - radio "2"
  `);
});

test(
  'names its radios through `formatValue` when set',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-rating label="Label" max="3" step="0.5"></slab-rating>`,
    );

    const host = page.locator('slab-rating');

    await host.evaluate<void, void, Rating>((element) => {
      element.formatValue = (value) =>
        value === 1 ? '1 star' : `${value} stars`;
    });

    await expect(host).toMatchAriaSnapshot(`
      - text: Label
      - radiogroup "Label":
        - radio "0.5 stars"
        - radio "1 star"
        - radio "1.5 stars"
        - radio "2 stars"
        - radio "2.5 stars"
        - radio "3 stars"
    `);

    await host.evaluate<void, void, Rating>((element) => {
      element.formatValue = undefined;
    });

    await expect(
      page.getByRole('radio', { name: '1', exact: true }),
    ).toHaveCount(1);
  },
);
