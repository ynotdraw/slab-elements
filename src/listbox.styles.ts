import { css } from 'lit';
import visuallyHidden from './library/visually-hidden.js';

export default [
  css`
    /*
      Functional, not visual. A hidden label still names the Listbox, so it's
      hidden visually rather than removed.
    */
    ${visuallyHidden(":host([hide-label]) [part~='label']")}
  `,
  css`
    /*
      Functional, not visual. With "virtual", the Options scroll within the
      listbox, whose block size is left to "::part(listbox)". Scroll anchoring
      is off because the spacers above the Options change size as they scroll,
      which it would otherwise answer by scrolling more.
    */
    :host([virtual]) [part~='listbox'] {
      overflow-anchor: none;
      overflow-y: auto;
    }
  `,
];
