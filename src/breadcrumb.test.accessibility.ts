import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`
      <slab-breadcrumb>
        <a href="#">One</a>
        <a href="#">Two</a>
      </slab-breadcrumb>
    `,
  );

  await expect(page).toBeAccessible('slab-breadcrumb');
});

test(
  'has a navigation',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-breadcrumb>
          <a href="#">One</a>
          <a href="#">Two</a>
          <a href="#">Three</a>
        </slab-breadcrumb>`,
    );

    await expect(page.locator('slab-breadcrumb')).toMatchAriaSnapshot(`
    - navigation "Breadcrumb":
      - list:
        - listitem:
          - link "One":
            - /url: "#"
        - listitem:
          - link "Two":
            - /url: "#"
        - listitem:
          - link "Three":
            - /url: "#"
  `);
  },
);

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-breadcrumb label="Label">
        <a href="#">One</a>
        <a href="#">Two</a>
        <a href="#">Three</a>
      </slab-breadcrumb>`,
  );

  await expect(page.locator('slab-breadcrumb')).toMatchAriaSnapshot(`
    - navigation "Label"
  `);
});
