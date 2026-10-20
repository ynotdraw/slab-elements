import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Listbox from './listbox.js';
import type Option from './option.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`
      <slab-listbox label="Label" name="name" value="one">
        <slab-option value="one">One</slab-option>
        <slab-option value="two">Two</slab-option>
        <slab-option value="three" disabled>Three</slab-option>

        <div slot="description">Description</div>
      </slab-listbox>
    `,
  );

  await expect(page).toBeAccessible('slab-listbox');
});

test(
  'is accessible when multiple',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-listbox label="Label" multiple>
          <slab-option selected>One</slab-option>
          <slab-option selected>Two</slab-option>
        </slab-listbox>
      `,
    );

    await expect(page).toBeAccessible('slab-listbox');
  },
);

test('has a listbox', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-listbox label="Label">
        <slab-option value="one">One</slab-option>
        <slab-option value="two">Two</slab-option>
        <slab-option value="three">Three</slab-option>
      </slab-listbox>`,
  );

  await expect(page.locator('slab-listbox')).toMatchAriaSnapshot(`
    - text: Label
    - listbox "Label":
      - option "One"
      - option "Two"
      - option "Three"
  `);
});

test('value', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-listbox label="Label">
        <slab-option value="one">One</slab-option>
        <slab-option value="two">Two</slab-option>
        <slab-option value="three">Three</slab-option>
      </slab-listbox>`,
  );

  await page
    .locator('slab-listbox')
    .evaluate<void, void, Listbox>((element) => {
      element.value = 'two';
    });

  await expect(page.locator('slab-listbox')).toMatchAriaSnapshot(`
    - text: Label
    - listbox "Label":
      - option "One"
      - option "Two" [selected]
      - option "Three"
  `);
});

test('multiple', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-listbox label="Label" multiple>
        <slab-option value="one">One</slab-option>
        <slab-option value="two">Two</slab-option>
        <slab-option value="three">Three</slab-option>
      </slab-listbox>`,
  );

  await page
    .locator('slab-listbox')
    .evaluate<void, void, Listbox>((element) => {
      element.values = ['one', 'three'];
    });

  await expect(page.locator('slab-listbox')).toMatchAriaSnapshot(`
    - text: Label
    - listbox "Label":
      - option "One" [selected]
      - option "Two"
      - option "Three" [selected]
  `);

  await expect(page.getByRole('listbox')).toHaveAttribute(
    'aria-multiselectable',
    'true',
  );
});

test('disabled', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-listbox label="Label">
        <slab-option value="one">One</slab-option>
        <slab-option value="two">Two</slab-option>
        <slab-option value="three">Three</slab-option>
      </slab-listbox>`,
  );

  await page
    .locator('slab-listbox')
    .evaluate<void, void, Listbox>((element) => {
      element.disabled = true;
    });

  await expect(page.locator('slab-listbox')).toMatchAriaSnapshot(`
    - text: Label
    - listbox "Label" [disabled]:
      - option "One" [disabled]
      - option "Two" [disabled]
      - option "Three" [disabled]
  `);
});

test('hide-label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-listbox label="Label">
        <slab-option value="one">One</slab-option>
        <slab-option value="two">Two</slab-option>
        <slab-option value="three">Three</slab-option>
      </slab-listbox>`,
  );

  await page
    .locator('slab-listbox')
    .evaluate<void, void, Listbox>((element) => {
      element.hideLabel = true;
    });

  // Hidden visually, but still in the accessibility tree and still naming the
  // listbox.
  await expect(page.locator('slab-listbox')).toMatchAriaSnapshot(`
    - text: Label
    - listbox "Label":
      - option "One"
      - option "Two"
      - option "Three"
  `);
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
          <slab-option value="three">Three</slab-option>
        </slab-listbox>`,
    );

    await page
      .locator('slab-listbox')
      .evaluate<void, void, Listbox>((element) => {
        const div = document.createElement('div');

        div.textContent = 'Description';
        div.slot = 'description';

        element.append(div);
      });

    await expect(page.locator('slab-listbox')).toMatchAriaSnapshot(`
    - text: Label
    - listbox "Label"
    - text: Description
  `);

    await expect(page.getByRole('listbox')).toHaveAccessibleDescription(
      'Description',
    );
  },
);

test(
  '<slab-option>.disabled',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
          <slab-option value="three">Three</slab-option>
        </slab-listbox>`,
    );

    await page
      .locator('slab-option')
      .first()
      .evaluate<void, void, Option>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-listbox')).toMatchAriaSnapshot(`
      - text: Label
      - listbox "Label":
        - option "One" [disabled]
        - option "Two"
        - option "Three"
    `);
  },
);

test(
  '<slab-option>.label',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
          <slab-option value="three">Three</slab-option>
        </slab-listbox>`,
    );

    await page
      .locator('slab-option')
      .first()
      .evaluate<void, void, Option>((element) => {
        element.label = 'Label';
      });

    await expect(page.locator('slab-listbox')).toMatchAriaSnapshot(`
      - text: Label
      - listbox "Label":
        - option "Label"
        - option "Two"
        - option "Three"
    `);
  },
);

test(
  '<slab-option>.selected',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
          <slab-option value="three">Three</slab-option>
        </slab-listbox>`,
    );

    await page
      .locator('slab-option')
      .nth(2)
      .evaluate<void, void, Option>((element) => {
        element.selected = true;
      });

    await expect(page.locator('slab-listbox')).toMatchAriaSnapshot(`
      - text: Label
      - listbox "Label":
        - option "One"
        - option "Two"
        - option "Three" [selected]
    `);
  },
);

test(
  'shows its validity message',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" required>
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
          <slab-option value="three">Three</slab-option>
        </slab-listbox>`,
    );

    await page
      .locator('slab-listbox')
      .evaluate<void, void, Listbox>((element) => {
        element.setCustomValidity('Pick one');
        element.reportValidity();
      });

    await expect(page.locator('slab-listbox')).toMatchAriaSnapshot(`
      - text: Label
      - listbox "Label"
      - text: Pick one
    `);

    await expect(page.getByRole('listbox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  },
);

// There's no ARIA snapshot of `aria-activedescendant`, and Axe only reads the
// attribute, which can't be used across the shadow boundary. So the element
// the listbox points at is read back directly, in each browser.
test(
  'points `aria-activedescendant` at its active option',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-listbox label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-listbox>
      `,
    );

    const host = page.locator('slab-listbox');

    const getActiveDescendant = () => {
      return host.evaluate<string | null, void, Listbox>((element) => {
        const listbox = element.shadowRoot?.querySelector('[role="listbox"]');
        return listbox?.ariaActiveDescendantElement?.textContent ?? null;
      });
    };

    expect(await getActiveDescendant()).toBeNull();

    await page.keyboard.press('Tab');
    expect(await getActiveDescendant()).toBe('One');

    await page.keyboard.press('ArrowDown');
    expect(await getActiveDescendant()).toBe('Two');
  },
);

test(
  'points `aria-activedescendant` at an option made active before it rendered',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
          <slab-option value="three">Three</slab-option>
        </slab-listbox>`,
    );

    const isPointedAt = await page
      .locator('slab-listbox')
      .evaluate<boolean, void, Listbox>(async (element) => {
        const ListboxConstructor = element.constructor as new () => Listbox;
        const listbox = new ListboxConstructor();

        listbox.label = 'Label';
        listbox.innerHTML = '<slab-option>One</slab-option>';

        // Before it's connected, so before it has rendered.
        listbox.activeOption = listbox.options.at(0) ?? null;

        document.body.append(listbox);
        await listbox.updateComplete;

        return (
          listbox.shadowRoot?.querySelector('[role="listbox"]')
            ?.ariaActiveDescendantElement === listbox.options.at(0)
        );
      });

    expect(isPointedAt).toBe(true);
  },
);
