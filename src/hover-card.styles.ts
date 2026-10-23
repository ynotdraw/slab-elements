import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A popover in the top layer is centered in the
      viewport by the browser's own styles, nowhere near its anchor. These put
      the card beside its anchor and keep it on screen, and nothing more: how
      far from the anchor it sits, and how it looks, is a margin and the rest
      on "::part(card)".

      The anchor name is tree-scoped to this shadow root, so two cards on a
      page don't share it and a consumer's own anchor names can't collide with
      it.
    */
    ::slotted([slot='anchor']) {
      anchor-name: --anchor;
    }

    [part~='card'] {
      inset: auto;
      margin: 0;
      position-anchor: --anchor;
      position-area: bottom;
      position-try-fallbacks: flip-block, flip-inline;
    }

    :host([placement='top']) [part~='card'] {
      position-area: top;
    }

    :host([placement='left']) [part~='card'] {
      position-area: left;
    }

    :host([placement='right']) [part~='card'] {
      position-area: right;
    }
  `,
];
