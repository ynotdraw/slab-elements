import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A custom element is inline by default, and an
      item is a block.

      The handle is dragged rather than scrolled or selected from, so the
      browser is told not to pan or select when a touch or a press starts on
      it.
    */
    :host {
      display: block;
    }

    [part~='handle'] {
      touch-action: none;
      user-select: none;
    }
  `,
];
