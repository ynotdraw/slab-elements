import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Select from './select.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`
      <slab-select label="Label" name="name" value="one">
        <slab-option value="one">One</slab-option>
        <slab-option value="two">Two</slab-option>
        <slab-option value="three" disabled>Three</slab-option>

        <div slot="description">Description</div>
      </slab-select>
    `,
  );

  await expect(page).toBeAccessible('slab-select');
});

test(
  'is accessible when open',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-select label="Label" multiple open>
          <slab-option selected>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-select>
      `,
    );

    await expect(page).toBeAccessible('slab-select');
  },
);

test(
  'is accessible with a placeholder',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-select label="Label" placeholder="Placeholder">
          <slab-option>One</slab-option>
        </slab-select>
      `,
    );

    await expect(page).toBeAccessible('slab-select');
  },
);

test('has a combobox', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-select
        label="Label"
        placeholder="Choose one"
        placement="bottom"
      >
        <slab-option value="one">One</slab-option>
        <slab-option value="two">Two</slab-option>
        <slab-option value="three">Three</slab-option>
      </slab-select>`,
  );

  await expect(page.locator('slab-select')).toMatchAriaSnapshot(`
    - text: Label
    - combobox "Label": Choose one
  `);
});

test('open', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-select
        label="Label"
        placeholder="Choose one"
        placement="bottom"
      >
        <slab-option value="one">One</slab-option>
        <slab-option value="two">Two</slab-option>
        <slab-option value="three">Three</slab-option>
      </slab-select>`,
  );

  await page.locator('slab-select').evaluate<void, void, Select>((element) => {
    element.open = true;
  });

  await expect(page.locator('slab-select')).toMatchAriaSnapshot(`
    - text: Label
    - combobox "Label" [expanded]: Choose one
    - listbox "Label":
      - option "One"
      - option "Two"
      - option "Three"
  `);
});

test('value', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-select
        label="Label"
        placeholder="Choose one"
        placement="bottom"
      >
        <slab-option value="one">One</slab-option>
        <slab-option value="two">Two</slab-option>
        <slab-option value="three">Three</slab-option>
      </slab-select>`,
  );

  await page.locator('slab-select').evaluate<void, void, Select>((element) => {
    element.value = 'two';
  });

  await expect(page.locator('slab-select')).toMatchAriaSnapshot(`
    - text: Label
    - combobox "Label": Two
  `);
});

test('multiple', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-select
        label="Label"
        placeholder="Choose one"
        placement="bottom"
        multiple
      >
        <slab-option value="one">One</slab-option>
        <slab-option value="two">Two</slab-option>
        <slab-option value="three">Three</slab-option>
      </slab-select>`,
  );

  await page.locator('slab-select').evaluate<void, void, Select>((element) => {
    element.values = ['one', 'three'];
    element.open = true;
  });

  await expect(page.locator('slab-select')).toMatchAriaSnapshot(`
    - text: Label
    - combobox "Label" [expanded]: One, Three
    - listbox "Label":
      - option "One" [selected]
      - option "Two"
      - option "Three" [selected]
  `);
});

test('disabled', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-select
        label="Label"
        placeholder="Choose one"
        placement="bottom"
      >
        <slab-option value="one">One</slab-option>
        <slab-option value="two">Two</slab-option>
        <slab-option value="three">Three</slab-option>
      </slab-select>`,
  );

  await page.locator('slab-select').evaluate<void, void, Select>((element) => {
    element.disabled = true;
  });

  await expect(page.locator('slab-select')).toMatchAriaSnapshot(`
    - text: Label
    - combobox "Label" [disabled]: Choose one
  `);
});

test('hide-label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-select
        label="Label"
        placeholder="Choose one"
        placement="bottom"
      >
        <slab-option value="one">One</slab-option>
        <slab-option value="two">Two</slab-option>
        <slab-option value="three">Three</slab-option>
      </slab-select>`,
  );

  await page.locator('slab-select').evaluate<void, void, Select>((element) => {
    element.hideLabel = true;
  });

  await expect(page.locator('slab-select')).toMatchAriaSnapshot(`
    - text: Label
    - combobox "Label": Choose one
  `);
});

test('required', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-select
        label="Label"
        placeholder="Choose one"
        placement="bottom"
      >
        <slab-option value="one">One</slab-option>
        <slab-option value="two">Two</slab-option>
        <slab-option value="three">Three</slab-option>
      </slab-select>`,
  );

  await page.locator('slab-select').evaluate<void, void, Select>((element) => {
    element.required = true;
  });

  await expect(page.getByRole('combobox')).toHaveAttribute(
    'aria-required',
    'true',
  );
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select
          label="Label"
          placeholder="Choose one"
          placement="bottom"
        >
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
          <slab-option value="three">Three</slab-option>
        </slab-select>`,
    );

    await page
      .locator('slab-select')
      .evaluate<void, void, Select>((element) => {
        const div = document.createElement('div');

        div.textContent = 'Description';
        div.slot = 'description';

        element.append(div);
      });

    await expect(page.getByRole('combobox')).toHaveAccessibleDescription(
      'Description',
    );
  },
);

test('with an error', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-select
        label="Label"
        placeholder="Choose one"
        placement="bottom"
        required
      >
        <slab-option value="one">One</slab-option>
        <slab-option value="two">Two</slab-option>
        <slab-option value="three">Three</slab-option>
      </slab-select>`,
  );

  await page.locator('slab-select').evaluate<void, void, Select>((element) => {
    element.setCustomValidity('message');
    element.reportValidity();
  });

  await expect(page.getByRole('combobox')).toHaveAttribute(
    'aria-invalid',
    'true',
  );

  await expect(page.getByRole('combobox')).toHaveAccessibleDescription(
    'message',
  );
});
