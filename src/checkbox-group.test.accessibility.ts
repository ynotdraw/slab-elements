import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type CheckboxGroup from './checkbox-group.js';
import type Checkbox from './checkbox.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-checkbox-group label="Label">
        <slab-checkbox label="Label"></slab-checkbox>
        <div slot="description">Description</div>
      </slab-checkbox-group>`,
  );

  await expect(page).toBeAccessible('slab-checkbox-group');
});

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label">
          <slab-checkbox label="One" value="one"></slab-checkbox>
          <slab-checkbox label="Two" value="two"></slab-checkbox>
          <slab-checkbox label="Three" value="three"></slab-checkbox>
        </slab-checkbox-group>`,
    );

    await page
      .locator('slab-checkbox-group')
      .evaluate<void, void, CheckboxGroup>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-checkbox-group')).toMatchAriaSnapshot(`
    - text: Label
    - group "Label":
      - checkbox "One" [disabled]
      - text: One
      - checkbox "Two" [disabled]
      - text: Two
      - checkbox "Three" [disabled]
      - text: Three
  `);
  },
);

test(
  'disabled=${false}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label">
          <slab-checkbox label="One" value="one"></slab-checkbox>
          <slab-checkbox label="Two" value="two"></slab-checkbox>
          <slab-checkbox label="Three" value="three"></slab-checkbox>
        </slab-checkbox-group>`,
    );

    await expect(page.locator('slab-checkbox-group')).toMatchAriaSnapshot(`
    - text: Label
    - group "Label":
      - checkbox "One"
      - text: One
      - checkbox "Two"
      - text: Two
      - checkbox "Three"
      - text: Three
  `);
  },
);

test('hide-label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-checkbox-group label="Label">
        <slab-checkbox label="One" value="one"></slab-checkbox>
        <slab-checkbox label="Two" value="two"></slab-checkbox>
        <slab-checkbox label="Three" value="three"></slab-checkbox>
      </slab-checkbox-group>`,
  );

  await page
    .locator('slab-checkbox-group')
    .evaluate<void, void, CheckboxGroup>((element) => {
      element.hideLabel = true;
    });

  // Hidden visually, so it still names the group.
  await expect(page.locator('slab-checkbox-group')).toMatchAriaSnapshot(`
    - text: Label
    - group "Label":
      - checkbox "One"
      - text: One
  `);
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label">
          <slab-checkbox label="One" value="one"></slab-checkbox>
          <slab-checkbox label="Two" value="two"></slab-checkbox>
          <slab-checkbox label="Three" value="three"></slab-checkbox>
        </slab-checkbox-group>`,
    );

    await page
      .locator('slab-checkbox-group')
      .evaluate<void, void, CheckboxGroup>((element) => {
        const div = document.createElement('div');

        div.textContent = 'Description';
        div.slot = 'description';

        element.append(div);
      });

    // The description names the group rather than describing it, because
    // VoiceOver doesn't read `aria-describedby` on one.
    await expect(page.locator('slab-checkbox-group')).toMatchAriaSnapshot(`
    - text: Label
    - group "Label Description":
      - checkbox "One"
      - text: One
  `);
  },
);

test(
  '<slab-checkbox>[checked=${true}]',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label">
          <slab-checkbox label="One" value="one"></slab-checkbox>
          <slab-checkbox label="Two" value="two"></slab-checkbox>
          <slab-checkbox label="Three" value="three"></slab-checkbox>
        </slab-checkbox-group>`,
    );

    await page
      .locator('slab-checkbox')
      .first()
      .evaluate<void, void, Checkbox>((element) => {
        element.checked = true;
      });

    await expect(page.locator('slab-checkbox-group')).toMatchAriaSnapshot(`
      - text: Label
      - group "Label":
        - checkbox "One" [checked]
        - text: One
    `);
  },
);
