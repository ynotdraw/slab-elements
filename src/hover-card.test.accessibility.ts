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

test(
  "points its anchor's `aria-details` at its content",
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card>
          <div id="content"><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    const anchor = page.getByRole('link', { name: 'Anchor' });

    await expect(anchor).toHaveAttribute('aria-details', 'content');

    // A preview, not a menu or a disclosure.
    await expect(anchor).not.toHaveAttribute('aria-haspopup');
    await expect(anchor).not.toHaveAttribute('aria-expanded');
  },
);

test(
  'gives its content an ID when it has none',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card>
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    const id = await page
      .locator('slab-hover-card')
      .evaluate((element) => element.querySelector(':scope > div')?.id ?? '');

    expect(id).not.toBe('');

    await expect(page.getByRole('link', { name: 'Anchor' })).toHaveAttribute(
      'aria-details',
      id,
    );
  },
);

test(
  "keeps its anchor's own `aria-details`",
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<p id="other">Other</p>
          <slab-hover-card>
            <div id="content"><a href="#">Link</a></div>
            <a aria-details="other" href="#" slot="anchor">Anchor</a>
          </slab-hover-card>`,
    );

    const anchor = page.getByRole('link', { name: 'Anchor' });
    const host = page.locator('slab-hover-card');

    await expect(anchor).toHaveAttribute('aria-details', 'other content');

    await host.evaluate<void, void, HoverCard>((element) => {
      element.disabled = true;
    });

    await expect(anchor).toHaveAttribute('aria-details', 'other');

    await host.evaluate<void, void, HoverCard>((element) => {
      element.disabled = false;
    });

    await expect(anchor).toHaveAttribute('aria-details', 'other content');

    // Removed, it takes its ID back out.
    await host.evaluate((element) => {
      const anchor = element.querySelector('[slot="anchor"]');

      if (anchor) {
        document.body.append(anchor);
      }

      element.remove();
    });

    await expect(anchor).toHaveAttribute('aria-details', 'other');
  },
);

test(
  'removes `aria-details` from an anchor it no longer has',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card>
          <div id="content"><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    await page.locator('slab-hover-card').evaluate((element) => {
      const anchor = element.querySelector('[slot="anchor"]');

      if (anchor) {
        document.body.append(anchor);
      }

      const other = document.createElement('a');
      other.href = '#';
      other.slot = 'anchor';
      other.textContent = 'Other';
      element.append(other);
    });

    await expect(
      page.getByRole('link', { name: 'Anchor' }),
    ).not.toHaveAttribute('aria-details');

    await expect(page.getByRole('link', { name: 'Other' })).toHaveAttribute(
      'aria-details',
      'content',
    );
  },
);

test(
  'is a group named by its `label`',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card label="Profile preview" open>
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    await expect(page.locator('slab-hover-card')).toMatchAriaSnapshot(`
      - link "Anchor"
      - group "Profile preview":
        - link "Link"
    `);

    await page
      .locator('slab-hover-card')
      .evaluate<void, void, HoverCard>((element) => {
        element.label = undefined;
      });

    await expect(page.locator('[data-test="card"]')).not.toHaveAttribute(
      'role',
    );

    await expect(page.locator('[data-test="card"]')).not.toHaveAttribute(
      'aria-label',
    );
  },
);

test(
  'reaches the focused element of a Slab anchor',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card>
          <div id="content"><a href="#">Link</a></div>
          <slab-copy-button
            label="Copy"
            slot="anchor"
            value="Text"
          ></slab-copy-button>
        </slab-hover-card>`,
    );

    await expect(page.locator('slab-copy-button')).toHaveAttribute(
      'aria-details',
      'content',
    );

    // Forwarded by element reflection, which the attribute doesn't show.
    await expect(
      page.locator('slab-copy-button').evaluate((element) => {
        const button = element.shadowRoot?.querySelector('button') as
          | (HTMLButtonElement & { ariaDetailsElements: Element[] | null })
          | null
          | undefined;

        return button?.ariaDetailsElements?.map((detail) => detail.id);
      }),
    ).resolves.toStrictEqual(['content']);
  },
);
