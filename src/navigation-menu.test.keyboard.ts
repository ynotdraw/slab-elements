import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'goes through every link and button via Tab',
  { tag: '@keyboard' },
  async ({ browserName, render, page }) => {
    // WebKit's Tab skips links, as Safari's does by default. Option-Tab
    // doesn't.

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

    const services = page.getByRole('button', { name: 'Services' });

    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(page.getByRole('link', { name: 'Home' })).toBeFocused();

    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(services).toBeFocused();

    await test.step('past a closed Item', async () => {
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
      await expect(page.getByRole('link', { name: 'Contact' })).toBeFocused();
    });

    await test.step('through an open Item', async () => {
      await page.keyboard.press(
        browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab',
      );

      await page.keyboard.press('Enter');
      await expect(services).toHaveAttribute('aria-expanded', 'true');

      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
      await expect(page.getByRole('link', { name: 'Pouring' })).toBeFocused();

      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
      await expect(page.getByRole('link', { name: 'Finishing' })).toBeFocused();
    });

    await test.step('and out of it, closing it', async () => {
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
      await expect(page.getByRole('link', { name: 'Contact' })).toBeFocused();
      await expect(services).toHaveAttribute('aria-expanded', 'false');
    });
  },
);

test(
  'stays open while focus moves between its button and links',
  { tag: '@keyboard' },
  async ({ browserName, render, page }) => {
    // WebKit's Tab skips links, as Safari's does by default. Option-Tab
    // doesn't.

    await render(
      () =>
        html`<slab-navigation-menu-item label="Services" open>
          <a href="#">Pouring</a>
          <a href="#">Finishing</a>
        </slab-navigation-menu-item>`,
    );

    const host = page.locator('slab-navigation-menu-item');

    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');

    await page.keyboard.press(
      browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab',
    );

    await expect(page.getByRole('button', { name: 'Services' })).toBeFocused();
    await expect(host).toHaveJSProperty('open', true);
  },
);

test(
  'opens and closes an Item via Enter and Space',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu label="Main">
          <slab-navigation-menu-item label="Services">
            <a href="#">Pouring</a>
          </slab-navigation-menu-item>
        </slab-navigation-menu>`,
    );

    const host = page.locator('slab-navigation-menu-item');
    const button = page.getByRole('button', { name: 'Services' });

    await expect(host).toDispatchEvents(
      () => button.press('Enter'),
      [
        {
          type: 'toggle',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(host).toHaveJSProperty('open', true);
    await expect(host).toHaveAttribute('open');
    await expect(page.getByRole('link', { name: 'Pouring' })).toBeVisible();

    await expect(host).toDispatchEvents(
      () => button.press('Space'),
      [
        {
          type: 'toggle',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(host).toHaveJSProperty('open', false);
    await expect(page.getByRole('link', { name: 'Pouring' })).toBeHidden();
  },
);

test(
  'closes an Item via Escape from its button',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu-item label="Services" open>
          <a href="#">Pouring</a>
        </slab-navigation-menu-item>`,
    );

    const button = page.getByRole('button', { name: 'Services' });

    await button.press('Escape');

    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();

    await test.step('and does nothing when closed', async () => {
      await expect(
        page.locator('slab-navigation-menu-item'),
      ).not.toDispatchEvents(
        () => button.press('Escape'),
        [{ type: 'toggle' }],
      );
    });
  },
);

test(
  'closes an Item via Escape from a link, returning focus to its button',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu-item label="Services" open>
          <a href="#">Pouring</a>
        </slab-navigation-menu-item>`,
    );

    const button = page.getByRole('button', { name: 'Services' });

    await page.getByRole('link', { name: 'Pouring' }).press('Escape');

    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
  },
);

test(
  'opens an Item at its first link via Down',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu-item label="Services">
          <h2>Services</h2>
          <a href="#">Pouring</a>
          <a href="#">Finishing</a>
        </slab-navigation-menu-item>`,
    );

    const button = page.getByRole('button', { name: 'Services' });

    await button.press('ArrowDown');

    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('link', { name: 'Pouring' })).toBeFocused();

    await test.step('and does the same when already open', async () => {
      await button.focus();
      await button.press('ArrowDown');

      await expect(page.getByRole('link', { name: 'Pouring' })).toBeFocused();
    });
  },
);

test(
  'opens an empty Item via Down, leaving focus on its button',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu-item label="Services">
          <p>Nothing yet</p>
        </slab-navigation-menu-item>`,
    );

    const button = page.getByRole('button', { name: 'Services' });

    await button.press('ArrowDown');

    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(button).toBeFocused();
  },
);

test(
  "moves between an Item's links via Up, Down, Home and End",
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu-item label="Services" open>
          <a href="#">Pouring</a>
          <button disabled>Sealing</button>
          <a href="#">Finishing</a>
          <a href="#">Repair</a>
        </slab-navigation-menu-item>`,
    );

    const pouring = page.getByRole('link', { name: 'Pouring' });
    const finishing = page.getByRole('link', { name: 'Finishing' });
    const repair = page.getByRole('link', { name: 'Repair' });

    await pouring.focus();

    await test.step('Down, skipping what is disabled', async () => {
      await page.keyboard.press('ArrowDown');
      await expect(finishing).toBeFocused();

      await page.keyboard.press('ArrowDown');
      await expect(repair).toBeFocused();
    });

    await test.step('Down from the last, going nowhere', async () => {
      await page.keyboard.press('ArrowDown');
      await expect(repair).toBeFocused();
    });

    await test.step('Home and End', async () => {
      await page.keyboard.press('Home');
      await expect(pouring).toBeFocused();

      await page.keyboard.press('End');
      await expect(repair).toBeFocused();
    });

    await test.step('Up', async () => {
      await page.keyboard.press('ArrowUp');
      await expect(finishing).toBeFocused();

      await page.keyboard.press('ArrowUp');
      await expect(pouring).toBeFocused();
    });

    await test.step('Up from the first, to the button', async () => {
      await page.keyboard.press('ArrowUp');

      await expect(
        page.getByRole('button', { name: 'Services' }),
      ).toBeFocused();

      await expect(page.locator('slab-navigation-menu-item')).toHaveJSProperty(
        'open',
        true,
      );
    });
  },
);

test(
  "leaves an Item's other keys alone",
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu-item label="Services" open>
          <a href="#">Pouring</a>
          <a href="#">Finishing</a>
        </slab-navigation-menu-item>`,
    );

    const pouring = page.getByRole('link', { name: 'Pouring' });
    const button = page.getByRole('button', { name: 'Services' });

    await pouring.focus();

    await test.step('a key it has no use for', async () => {
      await page.keyboard.press('ArrowRight');
      await expect(pouring).toBeFocused();
    });

    await test.step('with a modifier', async () => {
      await page.keyboard.press('Alt+ArrowDown');
      await expect(pouring).toBeFocused();

      await button.press('Control+ArrowDown');
      await expect(button).toBeFocused();
    });

    await test.step('already handled', async () => {
      await page.evaluate(() => {
        document.addEventListener(
          'keydown',
          (event) => event.preventDefault(),
          { capture: true },
        );
      });

      await pouring.press('ArrowDown');
      await expect(pouring).toBeFocused();

      await button.press('Escape');

      await expect(page.locator('slab-navigation-menu-item')).toHaveJSProperty(
        'open',
        true,
      );
    });
  },
);

test(
  'moves along the row via Left, Right, Home and End',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu label="Main">
          <a href="#">Home</a>

          <slab-navigation-menu-item label="Services">
            <a href="#">Pouring</a>
          </slab-navigation-menu-item>

          <span>Not focusable</span>
          <button disabled>Disabled</button>
          <a href="#">Contact</a>
        </slab-navigation-menu>`,
    );

    const home = page.getByRole('link', { name: 'Home' });
    const services = page.getByRole('button', { name: 'Services' });
    const contact = page.getByRole('link', { name: 'Contact' });

    await home.focus();

    await test.step('Right, skipping what focus cannot land on', async () => {
      await page.keyboard.press('ArrowRight');
      await expect(services).toBeFocused();

      await page.keyboard.press('ArrowRight');
      await expect(contact).toBeFocused();
    });

    await test.step('Right from the last, wrapping', async () => {
      await page.keyboard.press('ArrowRight');
      await expect(home).toBeFocused();
    });

    await test.step('Left from the first, wrapping', async () => {
      await page.keyboard.press('ArrowLeft');
      await expect(contact).toBeFocused();
    });

    await test.step('Home and End', async () => {
      await page.keyboard.press('Home');
      await expect(home).toBeFocused();

      await page.keyboard.press('End');
      await expect(contact).toBeFocused();
    });

    await test.step('a key it has no use for', async () => {
      await page.keyboard.press('ArrowUp');
      await expect(contact).toBeFocused();
    });

    await test.step('with a modifier', async () => {
      await page.keyboard.press('Alt+ArrowRight');
      await expect(contact).toBeFocused();
    });
  },
);

test(
  'closes an open Item when moving along the row',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu label="Main">
          <slab-navigation-menu-item label="Services">
            <a href="#">Pouring</a>
          </slab-navigation-menu-item>

          <a href="#">Contact</a>
        </slab-navigation-menu>`,
    );

    const services = page.getByRole('button', { name: 'Services' });

    await services.press('Enter');
    await expect(services).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('ArrowRight');

    await expect(page.getByRole('link', { name: 'Contact' })).toBeFocused();
    await expect(services).toHaveAttribute('aria-expanded', 'false');
  },
);

test(
  "leaves the row's keys alone in an Item's content",
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu label="Main">
          <slab-navigation-menu-item label="Services" open>
            <a href="#">Pouring</a>
          </slab-navigation-menu-item>

          <a href="#">Contact</a>
        </slab-navigation-menu>`,
    );

    const pouring = page.getByRole('link', { name: 'Pouring' });

    await pouring.focus();
    await page.keyboard.press('ArrowRight');

    await expect(pouring).toBeFocused();
  },
);
