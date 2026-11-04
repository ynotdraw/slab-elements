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

test(
  'is accessible with Option Groups',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-listbox label="Label">
          <slab-option>None</slab-option>
          <slab-option-group label="Fruit">
            <slab-option>Apple</slab-option>
            <slab-option>Banana</slab-option>
          </slab-option-group>
        </slab-listbox>
      `,
    );

    await expect(page).toBeAccessible('slab-listbox');

    await expect(page.getByRole('listbox')).toMatchAriaSnapshot(`
      - listbox "Label":
        - option "None"
        - group "Fruit":
          - option "Apple"
          - option "Banana"
    `);
  },
);

test(
  'is accessible when virtual',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <style>
          slab-listbox::part(listbox) {
            block-size: 200px;
          }
        </style>

        <slab-listbox label="Label" virtual>
          <slab-option-group label="Group">
            ${Array.from({ length: 100 }, (_, index) => {
              return html`<slab-option>Option ${index}</slab-option>`;
            })}
          </slab-option-group>
        </slab-listbox>
      `,
    );

    await expect(page).toBeAccessible('slab-listbox');
  },
);

test(
  'gives its rendered options their positions when virtual',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <style>
          slab-listbox::part(listbox) {
            block-size: 200px;
          }

          slab-option {
            block-size: 20px;
          }
        </style>

        <slab-listbox label="Label" virtual>
          <slab-option>One</slab-option>

          <slab-option-group label="Group">
            ${Array.from({ length: 1000 }, (_, index) => {
              return html`<slab-option>Option ${index}</slab-option>`;
            })}
          </slab-option-group>
        </slab-listbox>
      `,
    );

    // Counted within its group, the way a browser counts a group's options.
    await expect(page.getByRole('option', { name: 'One' })).toHaveAttribute(
      'aria-posinset',
      '1',
    );

    await expect(page.getByRole('option', { name: 'One' })).toHaveAttribute(
      'aria-setsize',
      '1',
    );

    await expect(
      page.getByRole('option', { name: 'Option 0' }),
    ).toHaveAttribute('aria-posinset', '1');

    await expect(
      page.getByRole('option', { name: 'Option 0' }),
    ).toHaveAttribute('aria-setsize', '1000');

    await page.keyboard.press('Tab');
    await page.keyboard.press('End');

    await expect(
      page.getByRole('option', { name: 'Option 999' }),
    ).toHaveAttribute('aria-posinset', '1000');

    // Not in the accessibility tree, so it has no need of one.
    await expect(page.locator('slab-option').nth(1)).not.toHaveAttribute(
      'aria-posinset',
    );
  },
);

test(
  'keeps its active option in the accessibility tree when it is scrolled away from and virtual',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <style>
          slab-listbox::part(listbox) {
            block-size: 200px;
          }

          slab-option {
            block-size: 20px;
          }
        </style>

        <slab-listbox label="Label" virtual>
          <slab-option-group label="Group">
            ${Array.from({ length: 1000 }, (_, index) => {
              return html`<slab-option>Option ${index}</slab-option>`;
            })}
          </slab-option-group>
        </slab-listbox>
      `,
    );

    const listbox = page.getByRole('listbox');

    await page.keyboard.press('Tab');
    await page.keyboard.press('End');

    await listbox.evaluate((element) => {
      element.scrollTop = 0;
    });

    await expect(page.getByRole('option', { name: 'Option 0' })).toBeVisible();

    const option = page.getByRole('option', { name: 'Option 999' });

    // In the tree, so `aria-activedescendant` still points at something, but
    // not seen.
    await expect(option).toBeAttached();
    await expect(option).not.toBeInViewport();
    await expect(option).toHaveAttribute('aria-posinset', '1000');

    expect(
      await listbox.evaluate((element) => {
        return element.ariaActiveDescendantElement?.textContent;
      }),
    ).toBe('Option 999');

    // And its group with it, though no other option of the group is.
    await page.getByRole('option', { name: 'Option 0' }).waitFor();

    await listbox.evaluate((element) => {
      element.scrollTop = 10_000;
    });

    await expect(
      page.getByRole('option', { name: 'Option 500' }),
    ).toBeInViewport();

    await expect(page.getByRole('group', { name: 'Group' })).toBeVisible();
  },
);
