import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-navigation-menu label="Main">
        <a href="#">Home</a>

        <slab-navigation-menu-item label="Services">
          <a href="#">Pouring</a>
          <a href="#">Finishing</a>
        </slab-navigation-menu-item>
      </slab-navigation-menu>`,
  );

  await expect(page).toBeAccessible('slab-navigation-menu');
});

test(
  'is accessible when open',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu label="Main">
          <a href="#">Home</a>

          <slab-navigation-menu-item label="Services" open>
            <a href="#">Pouring</a>
            <a href="#">Finishing</a>
          </slab-navigation-menu-item>
        </slab-navigation-menu>`,
    );

    await expect(page).toBeAccessible('slab-navigation-menu');
  },
);

test(
  'has a navigation of links and buttons',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu label="Main">
          <a href="#">Home</a>

          <slab-navigation-menu-item label="Services">
            <a href="#">Pouring</a>
            <a href="#">Finishing</a>
          </slab-navigation-menu-item>

          <a href="#">Contact</a>
        </slab-navigation-menu>`,
    );

    await expect(page.locator('slab-navigation-menu')).toMatchAriaSnapshot(`
      - navigation "Main":
        - list:
          - listitem:
            - link "Home":
              - /url: "#"
          - listitem:
            - button "Services" [expanded=false]
          - listitem:
            - link "Contact":
              - /url: "#"
    `);
  },
);

test(
  'shows its links in a list when open',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu label="Main">
          <slab-navigation-menu-item label="Services" open>
            <a href="#">Pouring</a>
            <a href="#">Finishing</a>
          </slab-navigation-menu-item>
        </slab-navigation-menu>`,
    );

    await expect(page.locator('slab-navigation-menu')).toMatchAriaSnapshot(`
      - navigation "Main":
        - list:
          - listitem:
            - button "Services" [expanded]
            - list:
              - listitem:
                - link "Pouring":
                  - /url: "#"
              - listitem:
                - link "Finishing":
                  - /url: "#"
    `);
  },
);

test(
  'controls its content with its button',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu-item label="Services">
          <a href="#">Pouring</a>
        </slab-navigation-menu-item>`,
    );

    const controls = await page
      .getByRole('button', { name: 'Services' })
      .getAttribute('aria-controls');

    await expect(page.locator('[part~="content"]')).toHaveId(String(controls));
  },
);
