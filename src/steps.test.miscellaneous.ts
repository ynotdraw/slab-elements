import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Steps from './steps.js';

// Each Step's number and status, in order.
function getSteps(page: import('@playwright/test').Page) {
  return page
    .locator('slab-steps')
    .first()
    .evaluate<string[], void, Steps>((element) => {
      return element.steps.map(({ index, status }) => `${index} ${status}`);
    });
}

// Which of a Step's states are set.
function getStates(locator: import('@playwright/test').Locator) {
  return locator.evaluate((element) => {
    return ['complete', 'current', 'navigable', 'upcoming'].filter((state) => {
      return element.matches(`:state(${state})`);
    });
  });
}

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-steps label="Checkout">
        <slab-steps-step>Cart</slab-steps-step>
      </slab-steps>`,
  );

  await expect(page.locator('slab-steps')).toBeInTheCustomElementRegistry(
    'slab-steps',
  );

  await expect(page.locator('slab-steps-step')).toBeInTheCustomElementRegistry(
    'slab-steps-step',
  );
});

test(
  'makes the Steps before `step` complete and the one at it current',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-steps label="Checkout" step="2">
          <slab-steps-step>Cart</slab-steps-step>
          <slab-steps-step>Shipping</slab-steps-step>
          <slab-steps-step>Payment</slab-steps-step>
        </slab-steps>`,
    );

    expect(await getSteps(page)).toStrictEqual([
      '1 complete',
      '2 current',
      '3 upcoming',
    ]);

    const steps = page.locator('slab-steps-step');

    expect(await getStates(steps.nth(0))).toStrictEqual(['complete']);
    expect(await getStates(steps.nth(1))).toStrictEqual(['current']);
    expect(await getStates(steps.nth(2))).toStrictEqual(['upcoming']);

    await expect(steps.nth(1).locator('[part~="step"]')).toHaveAttribute(
      'aria-current',
      'step',
    );

    await expect(steps.nth(0).locator('[part~="step"]')).not.toHaveAttribute(
      'aria-current',
    );

    await expect(steps.nth(0).locator('[part~="indicator"]')).toHaveText('1');

    await expect(steps.nth(0).locator('[part~="status"]')).toHaveText(
      'Completed',
    );

    await expect(steps.nth(1).locator('[part~="status"]')).toHaveCount(0);
  },
);

test(
  'makes every Step complete past the last one',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-steps label="Checkout" step="3">
          <slab-steps-step>Cart</slab-steps-step>
          <slab-steps-step>Shipping</slab-steps-step>
        </slab-steps>`,
    );

    expect(await getSteps(page)).toStrictEqual(['1 complete', '2 complete']);
  },
);

test(
  'follows `step` and `complete-label` as they change',
  { tag: '@miscellaneous' },
  async ({ render, page, setAttribute, setProperty }) => {
    await render(
      () =>
        html`<slab-steps label="Checkout">
          <slab-steps-step>Cart</slab-steps-step>
          <slab-steps-step>Shipping</slab-steps-step>
        </slab-steps>`,
    );

    const host = page.locator('slab-steps');

    await setProperty(host, 'step', 2);
    expect(await getSteps(page)).toStrictEqual(['1 complete', '2 current']);

    await setAttribute(host, 'complete-label', 'Done');

    await expect(
      page.locator('slab-steps-step').first().locator('[part~="status"]'),
    ).toHaveText('Done');
  },
);

test(
  'goes to the next and previous Steps with `next()` and `previous()`',
  { tag: '@miscellaneous' },
  async ({ render, page, callMethod }) => {
    await render(
      () =>
        html`<slab-steps label="Checkout">
          <slab-steps-step>Cart</slab-steps-step>
          <slab-steps-step>Shipping</slab-steps-step>
        </slab-steps>`,
    );

    const host = page.locator('slab-steps');

    await expect(host).not.toDispatchEvents(
      () => callMethod(host, 'next'),
      [{ type: 'change' }],
    );

    await expect(host).toHaveJSProperty('step', 2);

    // Past the last Step, where every one is complete, and no further.
    await callMethod(host, 'next');
    await callMethod(host, 'next');
    await expect(host).toHaveJSProperty('step', 3);
    expect(await getSteps(page)).toStrictEqual(['1 complete', '2 complete']);

    await callMethod(host, 'previous');
    await callMethod(host, 'previous');
    await callMethod(host, 'previous');
    await expect(host).toHaveJSProperty('step', 1);
  },
);

test(
  'makes its Steps buttons when navigable',
  { tag: '@miscellaneous' },
  async ({ render, page, removeAttribute }) => {
    await render(
      () =>
        html`<slab-steps label="Checkout" navigable>
          <slab-steps-step>Cart</slab-steps-step>
        </slab-steps>`,
    );

    const step = page.locator('slab-steps-step');

    await expect(page.getByRole('button', { name: 'Cart' })).toBeVisible();
    expect(await getStates(step)).toStrictEqual(['current', 'navigable']);

    await removeAttribute(page.locator('slab-steps'), 'navigable');

    await expect(page.getByRole('button')).toHaveCount(0);
    await expect.poll(() => getStates(step)).toStrictEqual(['current']);
  },
);

test(
  'follows Steps that are added, removed and reordered',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-steps label="Checkout" step="2">
          <slab-steps-step>Cart</slab-steps-step>
          <slab-steps-step>Shipping</slab-steps-step>
        </slab-steps>`,
    );

    const host = page.locator('slab-steps');

    await test.step('added', async () => {
      await host.evaluate((element) => {
        const step = document.createElement('slab-steps-step');
        step.textContent = 'Payment';
        element.append(step);
      });

      await expect(page.getByRole('listitem')).toHaveCount(3);

      await expect
        .poll(() => getSteps(page))
        .toStrictEqual(['1 complete', '2 current', '3 upcoming']);
    });

    await test.step('reordered', async () => {
      await host.evaluate((element) => {
        const first = element.firstElementChild;

        if (first) {
          element.append(first);
        }
      });

      await expect(host).toMatchAriaSnapshot(`
        - list:
          - listitem: Shipping Completed
          - listitem: Payment
          - listitem: Cart
      `);
    });

    await test.step('removed', async () => {
      await host.evaluate((element) => {
        element.firstElementChild?.remove();
      });

      await expect(page.getByRole('listitem')).toHaveCount(2);

      await expect
        .poll(() => getSteps(page))
        .toStrictEqual(['1 complete', '2 current']);
    });
  },
);

test(
  'numbers a Step that is defined after its Steps',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a
      // literal specifier as a module, and these are paths the dev server
      // serves rather than ones TypeScript can resolve.
      const stepsPath = '/src/steps.ts';

      const { default: Steps } = (await import(stepsPath)) as {
        default: CustomElementConstructor;
      };

      const stepPath = '/src/steps.step.ts';

      const { default: Step } = (await import(stepPath)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-steps', class extends Steps {});

      document.body.innerHTML = `<acme-steps label="Checkout" step="2">
        <acme-steps-step>Cart</acme-steps-step>
        <acme-steps-step>Shipping</acme-steps-step>
      </acme-steps>`;

      // Later, so the Steps has already rendered without them.
      await new Promise((resolve) => setTimeout(resolve, 0));
      window.customElements.define('acme-steps-step', class extends Step {});
    });

    await expect
      .poll(() => getStates(page.locator('acme-steps-step').nth(0)))
      .toStrictEqual(['complete']);

    expect(
      await getStates(page.locator('acme-steps-step').nth(1)),
    ).toStrictEqual(['current']);
  },
);

test(
  'numbers only its own Steps',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-steps label="Project" step="2">
          <slab-steps-step>
            Build
            <slab-steps label="Build" slot="description">
              <slab-steps-step>Forms</slab-steps-step>
              <slab-steps-step>Pour</slab-steps-step>
            </slab-steps>
          </slab-steps-step>
          <slab-steps-step>Inspect</slab-steps-step>
        </slab-steps>`,
    );

    expect(await getSteps(page)).toStrictEqual(['1 complete', '2 current']);

    const inner = await page
      .locator('slab-steps')
      .nth(1)
      .evaluate<string[], void, Steps>((element) => {
        return element.steps.map(({ index, status }) => `${index} ${status}`);
      });

    expect(inner).toStrictEqual(['1 current', '2 upcoming']);
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-steps>
            <slab-steps-step>Cart</slab-steps-step>
          </slab-steps>`,
      ),
    ).rejects.toThrow();
  },
);
