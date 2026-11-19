import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'focuses its input when its label is clicked',
  { tag: '@mouse' },
  async ({ browserName, render, page }) => {
    // Safari doesn't move focus to a range input when its label is clicked,
    // any more than it does to a native one. The input is the platform's, so
    // that's left alone.
    test.skip(browserName === 'webkit');

    await render(() => html`<slab-slider label="Label"></slab-slider>`);

    await page.locator('[part~="label"]').click();

    await expect(page.getByRole('slider')).toBeFocused();
  },
);

test(
  'dispatches "input" and "change" events when clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-slider label="Label" min="0" max="10"></slab-slider>`,
    );

    const host = page.locator('slab-slider');
    const slider = page.getByRole('slider');
    const box = await slider.boundingBox();

    // Near the left end, well away from the thumb, which starts halfway.
    await expect(host).toDispatchEvents(
      () =>
        page.mouse.click(
          (box?.x ?? 0) + 1,
          (box?.y ?? 0) + (box?.height ?? 0) / 2,
        ),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('value', '0');
  },
);

test(
  'is focused when an outside label is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`
        <label for="control">For</label>

        <label>
          <span>Around</span>
          <slab-slider id="control" label="Label"></slab-slider>
        </label>

        <button type="button">Elsewhere</button>
      `,
    );

    const focusable = page.locator('slab-slider');

    await page.getByText('For', { exact: true }).click();
    await expect(focusable).toBeFocused();

    await page.getByRole('button', { name: 'Elsewhere' }).focus();
    await expect(focusable).not.toBeFocused();

    await page.getByText('Around', { exact: true }).click();
    await expect(focusable).toBeFocused();
  },
);
