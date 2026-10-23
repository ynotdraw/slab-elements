import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`
      <slab-tags-input label="Label" name="name" value="one,two">
        <div slot="description">Description</div>
      </slab-tags-input>
    `,
  );

  await expect(page).toBeAccessible('slab-tags-input');
});

test(
  'is accessible when disabled',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-tags-input label="Label" value="one" disabled></slab-tags-input>
      `,
    );

    await expect(page).toBeAccessible('slab-tags-input');
  },
);

test(
  'has a button for each tag and a textbox',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-tags-input label="Label" value="one,two">
          <div slot="description">Description</div>
        </slab-tags-input>
      `,
    );

    await expect(page.locator('slab-tags-input')).toMatchAriaSnapshot(`
      - text: Label
      - button "Remove one": one
      - button "Remove two": two
      - textbox "Label"
      - text: Description
    `);

    // Its description starts with the tags, rather than with each tag's
    // "Remove".
    await expect(page.getByRole('textbox')).toHaveAccessibleDescription(
      'one, two Description',
    );
  },
);

test(
  'is described as required when `required`',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-tags-input label="Label" required></slab-tags-input>`,
    );

    const textbox = page.getByRole('textbox');

    await expect(textbox).toHaveAttribute('aria-required', 'true');

    await setProperty(page.locator('slab-tags-input'), 'required', false);

    await expect(textbox).toHaveAttribute('aria-required', 'false');
  },
);

test(
  'has a placeholder when `placeholder` is set',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tags-input
          label="Label"
          placeholder="Add a tag"
        ></slab-tags-input>`,
    );

    await expect(page.getByRole('textbox')).toHaveAttribute(
      'placeholder',
      'Add a tag',
    );
  },
);

test(
  'is named by its label when `hide-label` is set',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-tags-input label="Label" hide-label></slab-tags-input>`,
    );

    await expect(page.getByRole('textbox', { name: 'Label' })).toBeVisible();
  },
);
