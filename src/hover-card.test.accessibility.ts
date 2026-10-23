import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type HoverCard from './hover-card.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-hover-card open>
        <div>
          <p>Content</p>
          <a href="#">Link</a>
        </div>
        <a href="#" slot="anchor">Anchor</a>
      </slab-hover-card>`,
  );

  await expect(page).toBeAccessible('slab-hover-card');
});

test('open=${true}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-hover-card
        close-delay="300"
        open-delay="700"
        placement="bottom"
      >
        <div>
          <p>Content</p>
          <a href="#">Link</a>
        </div>
        <a href="#" slot="anchor">Anchor</a>
      </slab-hover-card>`,
  );

  await page
    .locator('slab-hover-card')
    .evaluate<void, void, HoverCard>((element) => {
      element.open = true;
    });

  await expect(page.locator('slab-hover-card')).toMatchAriaSnapshot(`
    - link "Anchor"
    - paragraph: Content
    - link "Link"
  `);

  // A link that expands would be announced as one, and activating it
  // navigates instead.
  await expect(page.getByRole('link', { name: 'Anchor' })).not.toHaveAttribute(
    'aria-expanded',
  );
});

test('open=${false}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-hover-card
        close-delay="300"
        open-delay="700"
        placement="bottom"
      >
        <div>
          <p>Content</p>
          <a href="#">Link</a>
        </div>
        <a href="#" slot="anchor">Anchor</a>
      </slab-hover-card>`,
  );

  await expect(page.locator('slab-hover-card')).toMatchAriaSnapshot(`
    - link "Anchor"
  `);
});

test('disabled', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-hover-card
        close-delay="300"
        open-delay="700"
        placement="bottom"
      >
        <div>
          <p>Content</p>
          <a href="#">Link</a>
        </div>
        <a href="#" slot="anchor">Anchor</a>
      </slab-hover-card>`,
  );

  await page
    .locator('slab-hover-card')
    .evaluate<void, void, HoverCard>((element) => {
      element.open = true;
      element.disabled = true;
    });

  await expect(page.locator('slab-hover-card')).toMatchAriaSnapshot(`
    - link "Anchor"
  `);
});
