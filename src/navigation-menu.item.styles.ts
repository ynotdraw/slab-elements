import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A custom element is inline by default, and an
      Item holds a button with a block of content below it.
    */
    :host {
      display: block;
    }

    /*
      A closed Item's content is hidden. Important, because a design's own
      \`display\` on "::part(content)" would otherwise win over a shadow root's
      styles and show it. An important declaration in a shadow root wins over
      one from outside it.
    */
    :host(:not([open])) [part~='content'] {
      display: none !important;
    }
  `,
];
