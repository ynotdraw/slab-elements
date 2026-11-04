import { css } from 'lit';
import visuallyHidden from './library/visually-hidden.js';

export default [
  css`
    /*
      Functional, not visual. A hidden label still names the Combobox, so it's
      hidden visually rather than removed.
    */
    ${visuallyHidden(":host([hide-label]) [part~='label']")}
  `,
  css`
    /*
      Functional, not visual. An Option filtered out of the listbox is hidden,
      which has to take it out of the layout and the accessibility tree. Its
      own "display: block" would otherwise win over "[hidden]".
    */
    ::slotted([hidden]) {
      display: none;
    }

    /*
      Functional, not visual. A popover in the top layer is centered in the
      viewport by the browser's own styles, nowhere near the input. These put
      the listbox beside it and keep it on screen, and nothing more: the gap,
      the width and the look are left to "::part(listbox)". The anchor name is
      tree-scoped to this shadow root, so it can't collide with another.
    */
    [part~='input'] {
      anchor-name: --input;
    }

    [part~='listbox'] {
      inset: auto;
      margin: 0;
      position-anchor: --input;
      position-area: bottom span-right;
      position-try-fallbacks: flip-block;
    }

    :host([placement='top']) [part~='listbox'] {
      position-area: top span-right;
    }

    /*
      Functional, not visual. With "virtual", the Options scroll within the
      listbox, whose maximum block size is left to "::part(listbox)". Scroll
      anchoring is off because the spacers above the Options change size as
      they scroll, which it would otherwise answer by scrolling more.
    */
    :host([virtual]) [part~='listbox'] {
      overflow-anchor: none;
      overflow-y: auto;
    }
  `,
];
