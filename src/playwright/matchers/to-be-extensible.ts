import { type Locator, expect } from '@playwright/test';

export default expect.extend({
  async toBeExtensible(locator: Locator) {
    const isExtensible = await locator.evaluate((node) => {
      const tag = node.tagName.toLowerCase();
      const Constructor = window.customElements.get(tag);

      if (Constructor) {
        class Component extends Constructor {}
        window.customElements.define('slab-component', Component);

        try {
          new Component();
        } catch {
          return false;
        }

        return true;
      }

      return null;
    });

    const message =
      isExtensible === null
        ? () =>
            this.utils.matcherHint('toBeExtensible', null, true) +
            '\n\n' +
            // Locators have a `toString()` implementation that serializes nicely.
            //

            `Locator: ${locator.toString()}\n` +
            `Expected: Locator to be a custom element.\n`
        : (this.isNot && isExtensible) || (!this.isNot && !isExtensible)
          ? () =>
              this.utils.matcherHint('toBeExtensible', true, false, {
                isNot: this.isNot,
              }) +
              '\n\n' +
              // Locators have a `toString()` implementation that serializes nicely.
              //

              `Locator: ${locator.toString()}\n` +
              `Expected: ${this.utils.printExpected(false)}\n` +
              `Received: ${this.utils.printReceived(true)}`
          : () => '';

    return {
      message,
      pass:
        this.isNot && isExtensible === null ? true : (isExtensible ?? false),
      name: 'toBeExtensible',
      actual: isExtensible,
      expected: !this.isNot,
    };
  },
});
