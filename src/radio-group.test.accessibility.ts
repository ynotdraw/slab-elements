import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type RadioGroup from './radio-group.js';
import type Radio from './radio-group.radio.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`
      <slab-radio-group label="Label" name="name" value="one">
        <slab-radio-group-radio
          label="One"
          value="one"
        ></slab-radio-group-radio>

        <slab-radio-group-radio
          label="Two"
          value="two"
        ></slab-radio-group-radio>

        <div slot="description">Description</div>
      </slab-radio-group>
    `,
  );

  await expect(page).toBeAccessible('slab-radio-group');
});

test('disabled', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-radio-group label="Label" value="one">
        <slab-radio-group-radio label="One" id="one" value="one" checked>
          One
        </slab-radio-group-radio>
        <slab-radio-group-radio label="Two" id="two" value="two">
          Two
        </slab-radio-group-radio>
        <slab-radio-group-radio label="Three" id="three" value="three">
          Three
        </slab-radio-group-radio>
      </slab-radio-group>`,
  );

  await page
    .locator('slab-radio-group')
    .evaluate<void, void, RadioGroup>((element) => {
      element.disabled = true;
    });

  await expect(page.locator('slab-radio-group')).toMatchAriaSnapshot(`
    - text: Label
    - radiogroup "Label":
      - radio "One" [disabled]
      - radio "Two" [disabled]
      - radio "Three" [disabled]
  `);
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label" value="one">
          <slab-radio-group-radio label="One" id="one" value="one" checked>
            One
          </slab-radio-group-radio>
          <slab-radio-group-radio label="Two" id="two" value="two">
            Two
          </slab-radio-group-radio>
          <slab-radio-group-radio label="Three" id="three" value="three">
            Three
          </slab-radio-group-radio>
        </slab-radio-group>`,
    );

    await page
      .locator('slab-radio-group')
      .evaluate<void, void, RadioGroup>((element) => {
        const div = document.createElement('div');

        div.textContent = 'Description';
        div.slot = 'description';

        element.append(div);
      });

    await expect(page.locator('slab-radio-group')).toMatchAriaSnapshot(`
    - text: Label
    - radiogroup "Label Description":
      - radio "One" [checked]
      - radio "Two"
      - radio "Three"
    - text: Description
  `);
  },
);

test(
  '<slab-radio-group-radio>.disabled',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label" value="one">
          <slab-radio-group-radio label="One" id="one" value="one" checked>
            One
          </slab-radio-group-radio>
          <slab-radio-group-radio label="Two" id="two" value="two">
            Two
          </slab-radio-group-radio>
          <slab-radio-group-radio label="Three" id="three" value="three">
            Three
          </slab-radio-group-radio>
        </slab-radio-group>`,
    );

    await page
      .locator('slab-radio-group-radio')
      .first()
      .evaluate<void, void, Radio>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-radio-group')).toMatchAriaSnapshot(`
      - text: Label
      - radiogroup "Label":
        - radio "One" [disabled]
        - radio "Two"
        - radio "Three"
    `);
  },
);

test(
  '<slab-radio-group-radio>[checked=${true}]',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label" value="one">
          <slab-radio-group-radio label="One" id="one" value="one" checked>
            One
          </slab-radio-group-radio>
          <slab-radio-group-radio label="Two" id="two" value="two">
            Two
          </slab-radio-group-radio>
          <slab-radio-group-radio label="Three" id="three" value="three">
            Three
          </slab-radio-group-radio>
        </slab-radio-group>`,
    );

    await expect(page.locator('slab-radio-group')).toMatchAriaSnapshot(`
      - text: Label
      - radiogroup "Label":
        - radio "One" [checked]
        - radio "Two"
        - radio "Three"
    `);
  },
);

test(
  '<slab-radio-group-radio>[checked=${false}]',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label" value="one">
          <slab-radio-group-radio label="One" id="one" value="one" checked>
            One
          </slab-radio-group-radio>
          <slab-radio-group-radio label="Two" id="two" value="two">
            Two
          </slab-radio-group-radio>
          <slab-radio-group-radio label="Three" id="three" value="three">
            Three
          </slab-radio-group-radio>
        </slab-radio-group>`,
    );

    await page
      .locator('slab-radio-group-radio')
      .first()
      .evaluate<void, void, Radio>((element) => {
        element.checked = false;
      });

    await expect(page.locator('slab-radio-group')).toMatchAriaSnapshot(`
      - text: Label
      - radiogroup "Label":
        - radio "One"
        - radio "Two"
        - radio "Three"
    `);
  },
);
