import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'opens and closes an Item when its button is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu-item label="Services">
          <a href="#">Pouring</a>
        </slab-navigation-menu-item>`,
    );

    const host = page.locator('slab-navigation-menu-item');
    const button = page.getByRole('button', { name: 'Services' });

    await expect(host).toDispatchEvents(
      () => button.click(),
      [
        {
          type: 'toggle',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(page.getByRole('link', { name: 'Pouring' })).toBeVisible();

    await button.click();

    await expect(host).toHaveJSProperty('open', false);
    await expect(page.getByRole('link', { name: 'Pouring' })).toBeHidden();
  },
);

test(
  'stays open when its content is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu-item label="Services" open>
          <p>Pouring</p>
        </slab-navigation-menu-item>`,
    );

    await page.getByText('Pouring').click();

    await expect(page.locator('slab-navigation-menu-item')).toHaveJSProperty(
      'open',
      true,
    );
  },
);

test(
  'closes an Item when something outside it is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu-item label="Services" open>
            <a href="#">Pouring</a>
          </slab-navigation-menu-item>

          <p>Outside</p>`,
    );

    await page.getByText('Outside').click();

    await expect(page.locator('slab-navigation-menu-item')).toHaveJSProperty(
      'open',
      false,
    );
  },
);

test(
  'closes the open Item when another is opened',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu label="Main">
          <slab-navigation-menu-item label="Services">
            <a href="#">Pouring</a>
          </slab-navigation-menu-item>

          <slab-navigation-menu-item label="Company">
            <a href="#">About</a>
          </slab-navigation-menu-item>
        </slab-navigation-menu>`,
    );

    const services = page.getByRole('button', { name: 'Services' });
    const company = page.getByRole('button', { name: 'Company' });

    await services.click();
    await company.click();

    await expect(company).toHaveAttribute('aria-expanded', 'true');
    await expect(services).toHaveAttribute('aria-expanded', 'false');
  },
);
