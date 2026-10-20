import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Combobox from './combobox.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`
      <slab-combobox label="Label" name="name" value="one">
        <slab-option value="one">One</slab-option>
        <slab-option value="two">Two</slab-option>
        <slab-option value="three" disabled>Three</slab-option>

        <div slot="description">Description</div>
      </slab-combobox>
    `,
  );

  await expect(page).toBeAccessible('slab-combobox');
});

test(
  'is accessible when open',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-combobox label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-combobox>
      `,
    );

    await page.getByRole('combobox').focus();
    await page.keyboard.press('ArrowDown');

    await expect(page).toBeAccessible('slab-combobox');
  },
);

test('has a combobox', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-combobox label="Label" placement="bottom">
        <slab-option value="apple">Apple</slab-option>
        <slab-option value="banana">Banana</slab-option>
        <slab-option value="cherry">Cherry</slab-option>
        <slab-option value="grape">Grape</slab-option>
      </slab-combobox>`,
  );

  // Closed, so the listbox isn't in the tree.
  await expect(page.locator('slab-combobox')).toMatchAriaSnapshot(`
    - text: Label
    - combobox "Label"
  `);

  await expect(page.getByRole('combobox')).toHaveAttribute(
    'aria-autocomplete',
    'list',
  );

  await expect(page.getByRole('combobox')).toHaveAttribute(
    'aria-expanded',
    'false',
  );

  await expect(page.getByRole('combobox')).toHaveAttribute(
    'aria-controls',
    'listbox',
  );
});

test('open', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-combobox label="Label" placement="bottom">
        <slab-option value="apple">Apple</slab-option>
        <slab-option value="banana">Banana</slab-option>
        <slab-option value="cherry">Cherry</slab-option>
        <slab-option value="grape">Grape</slab-option>
      </slab-combobox>`,
  );

  await page.getByRole('combobox').focus();
  await page.keyboard.press('Alt+ArrowDown');

  await expect(page.locator('slab-combobox')).toMatchAriaSnapshot(`
    - text: Label
    - combobox "Label" [expanded]
    - listbox "Label":
      - option "Apple"
      - option "Banana"
      - option "Cherry"
      - option "Grape"
  `);
});

test('filtered', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-combobox label="Label" placement="bottom">
        <slab-option value="apple">Apple</slab-option>
        <slab-option value="banana">Banana</slab-option>
        <slab-option value="cherry">Cherry</slab-option>
        <slab-option value="grape">Grape</slab-option>
      </slab-combobox>`,
  );

  await page.getByRole('combobox').pressSequentially('an');

  // Filtered out of the tree, not just out of sight.
  await expect(page.locator('slab-combobox')).toMatchAriaSnapshot(`
    - text: Label
    - combobox "Label" [expanded]: an
    - listbox "Label":
      - option "Banana"
  `);
});

test('value', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-combobox label="Label" placement="bottom">
        <slab-option value="apple">Apple</slab-option>
        <slab-option value="banana">Banana</slab-option>
        <slab-option value="cherry">Cherry</slab-option>
        <slab-option value="grape">Grape</slab-option>
      </slab-combobox>`,
  );

  await page
    .locator('slab-combobox')
    .evaluate<void, void, Combobox>((element) => {
      element.value = 'banana';
    });

  await expect(page.locator('slab-combobox')).toMatchAriaSnapshot(`
    - text: Label
    - combobox "Label": Banana
  `);

  await page.getByRole('combobox').focus();
  await page.keyboard.press('Alt+ArrowDown');

  await expect(page.locator('slab-combobox')).toMatchAriaSnapshot(`
    - text: Label
    - combobox "Label" [expanded]: Banana
    - listbox "Label":
      - option "Apple"
      - option "Banana" [selected]
      - option "Cherry"
      - option "Grape"
  `);
});

test('disabled', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-combobox label="Label" placement="bottom">
        <slab-option value="apple">Apple</slab-option>
        <slab-option value="banana">Banana</slab-option>
        <slab-option value="cherry">Cherry</slab-option>
        <slab-option value="grape">Grape</slab-option>
      </slab-combobox>`,
  );

  await page
    .locator('slab-combobox')
    .evaluate<void, void, Combobox>((element) => {
      element.disabled = true;
    });

  await expect(page.locator('slab-combobox')).toMatchAriaSnapshot(`
    - text: Label
    - combobox "Label" [disabled]
  `);
});

test('hide-label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-combobox label="Label" placement="bottom">
        <slab-option value="apple">Apple</slab-option>
        <slab-option value="banana">Banana</slab-option>
        <slab-option value="cherry">Cherry</slab-option>
        <slab-option value="grape">Grape</slab-option>
      </slab-combobox>`,
  );

  await page
    .locator('slab-combobox')
    .evaluate<void, void, Combobox>((element) => {
      element.hideLabel = true;
    });

  // Hidden visually, but still in the accessibility tree and still naming the
  // combobox.
  await expect(page.locator('slab-combobox')).toMatchAriaSnapshot(`
    - text: Label
    - combobox "Label"
  `);
});

test('placeholder', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-combobox label="Label" placement="bottom">
        <slab-option value="apple">Apple</slab-option>
        <slab-option value="banana">Banana</slab-option>
        <slab-option value="cherry">Cherry</slab-option>
        <slab-option value="grape">Grape</slab-option>
      </slab-combobox>`,
  );

  await page
    .locator('slab-combobox')
    .evaluate<void, void, Combobox>((element) => {
      element.placeholder = 'Placeholder';
    });

  await expect(page.getByRole('combobox')).toHaveAttribute(
    'placeholder',
    'Placeholder',
  );
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" placement="bottom">
          <slab-option value="apple">Apple</slab-option>
          <slab-option value="banana">Banana</slab-option>
          <slab-option value="cherry">Cherry</slab-option>
          <slab-option value="grape">Grape</slab-option>
        </slab-combobox>`,
    );

    await page.locator('slab-combobox').evaluate((element) => {
      const description = document.createElement('div');

      description.slot = 'description';
      description.textContent = 'Description';
      element.append(description);
    });

    await expect(page.getByRole('combobox')).toHaveAccessibleDescription(
      'Description',
    );
  },
);

test('validity', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-combobox label="Label" placement="bottom" required>
        <slab-option value="apple">Apple</slab-option>
        <slab-option value="banana">Banana</slab-option>
        <slab-option value="cherry">Cherry</slab-option>
        <slab-option value="grape">Grape</slab-option>
      </slab-combobox>`,
  );

  await page
    .locator('slab-combobox')
    .evaluate<void, void, Combobox>((element) => {
      element.reportValidity();
    });

  await expect(page.getByRole('combobox')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
});

// There's no ARIA snapshot of `aria-activedescendant`, and Axe only reads the
// attribute, which can't be used across the shadow boundary. So the element
// the input points at is read back directly, in each browser.
test(
  'points `aria-activedescendant` at its active option',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-combobox label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-combobox>
      `,
    );

    const host = page.locator('slab-combobox');

    const getActiveDescendant = () => {
      return host.evaluate<string | null, void, Combobox>((element) => {
        const input = element.shadowRoot?.querySelector('input');
        return input?.ariaActiveDescendantElement?.textContent ?? null;
      });
    };

    await page.getByRole('combobox').focus();
    expect(await getActiveDescendant()).toBeNull();

    await page.keyboard.press('ArrowDown');
    expect(await getActiveDescendant()).toBe('One');

    await page.keyboard.press('ArrowDown');
    expect(await getActiveDescendant()).toBe('Two');

    // Closing leaves nothing to point at.
    await page.keyboard.press('Escape');
    expect(await getActiveDescendant()).toBeNull();
  },
);

test(
  'is accessible when `multiple`',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-combobox label="Label" multiple>
          <slab-option value="one" selected>One</slab-option>
          <slab-option value="two" selected>Two</slab-option>
          <slab-option value="three">Three</slab-option>
        </slab-combobox>
      `,
    );

    await page.getByRole('combobox').focus();
    await page.keyboard.press('ArrowDown');

    await expect(page).toBeAccessible('slab-combobox');
  },
);

test(
  'has tags when `multiple`',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-combobox label="Label" multiple>
          <slab-option value="one" selected>One</slab-option>
          <slab-option value="two" selected>Two</slab-option>
          <slab-option value="three">Three</slab-option>

          <div slot="description">Description</div>
        </slab-combobox>
      `,
    );

    await page.getByRole('combobox').focus();
    await page.keyboard.press('Alt+ArrowDown');

    await expect(page.locator('slab-combobox')).toMatchAriaSnapshot(`
      - text: Label
      - button "Remove One": One
      - button "Remove Two": Two
      - combobox "Label" [expanded]
      - listbox "Label":
        - option "One" [selected]
        - option "Two" [selected]
        - option "Three"
      - text: Description
    `);

    await expect(page.getByRole('listbox')).toHaveAttribute(
      'aria-multiselectable',
      'true',
    );

    // Its description starts with what's selected, rather than with each
    // tag's "Remove".
    await expect(page.getByRole('combobox')).toHaveAccessibleDescription(
      'One, Two Description',
    );
  },
);
