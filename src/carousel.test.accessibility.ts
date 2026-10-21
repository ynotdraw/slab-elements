import { html } from 'lit';
import type Carousel from './carousel.js';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-carousel label="Label">
        <div>One</div>
        <div>Two</div>
      </slab-carousel>`,
  );

  await expect(page).toBeAccessible('slab-carousel');
});

test(
  'is accessible when `autoplay` is set',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel label="Label" autoplay>
          <div>One</div>
          <div>Two</div>
        </slab-carousel>`,
    );

    await expect(page).toBeAccessible('slab-carousel');
  },
);

test(
  'has a region of slides',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel label="Label">
          <div>One</div>
          <div>Two</div>
          <div>Three</div>
        </slab-carousel>`,
    );

    // The slides out of view are inert, so they aren't in the snapshot.
    await expect(page.locator('slab-carousel')).toMatchAriaSnapshot(`
      - region "Label":
        - button "Previous slide" [disabled]
        - button "Next slide"
        - group "1 of 3": One
        - button "Slide 1"
        - button "Slide 2"
        - button "Slide 3"
    `);

    // Playwright's ARIA snapshots leave out a role description and
    // `aria-current`.
    await expect(page.getByRole('region')).toHaveAttribute(
      'aria-roledescription',
      'carousel',
    );

    await expect(page.getByRole('group', { name: '1 of 3' })).toHaveAttribute(
      'aria-roledescription',
      'slide',
    );

    await expect(page.getByRole('button', { name: 'Slide 1' })).toHaveAttribute(
      'aria-current',
      'true',
    );

    await expect(page.locator('[part~="slides"]')).toHaveAttribute(
      'aria-live',
      'polite',
    );
  },
);

test(
  'autoplay=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel label="Label" autoplay>
          <div>One</div>
          <div>Two</div>
        </slab-carousel>`,
    );

    await expect(page.locator('slab-carousel')).toMatchAriaSnapshot(`
      - region "Label":
        - button "Stop slide rotation"
        - button "Previous slide" [disabled]
        - button "Next slide"
        - group "1 of 2": One
        - button "Slide 1"
        - button "Slide 2"
    `);

    // Rotating slides aren't announced, so a screenreader isn't interrupted.
    await expect(page.locator('[part~="slides"]')).toHaveAttribute(
      'aria-live',
      'off',
    );

    await page.getByRole('button', { name: 'Stop slide rotation' }).click();

    await expect(
      page.getByRole('button', { name: 'Start slide rotation' }),
    ).toBeVisible();

    await expect(page.locator('[part~="slides"]')).toHaveAttribute(
      'aria-live',
      'polite',
    );
  },
);

test('labels', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-carousel
        label="Label"
        autoplay
        next-label="Next"
        previous-label="Previous"
        start-label="Start"
        stop-label="Stop"
      >
        <div>One</div>
        <div aria-label="Own label">Two</div>
        <div role="tabpanel">Three</div>
      </slab-carousel>`,
  );

  await page
    .locator('slab-carousel')
    .evaluate<void, void, Carousel>((element) => {
      element.markerLabel = (index) => `Go to ${index + 1}`;
      element.slideLabel = (index, total) => `Slide ${index + 1}/${total}`;
    });

  await page.getByRole('button', { name: 'Stop' }).click();

  await expect(page.locator('slab-carousel')).toMatchAriaSnapshot(`
      - region "Label":
        - button "Start"
        - button "Previous" [disabled]
        - button "Next"
        - group "Slide 1/3": One
        - button "Go to 1"
        - button "Go to 2"
        - button "Go to 3"
    `);

  // A slide's own name and role are left alone.
  await expect(page.getByText('Two')).toHaveAttribute(
    'aria-label',
    'Own label',
  );

  await expect(page.getByText('Three')).toHaveAttribute('role', 'tabpanel');
});
