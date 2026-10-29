import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. An Option Group is a block of rows, as each
      Option is.
    */
    :host {
      display: block;
    }

    /*
      Functional, not visual. Combobox hides an Option Group with \`hidden\`
      once it's filtered out every Option in it, and important for the same
      reason Option's is: a \`display\` from a subclass or a page would win.
    */
    :host([hidden]) {
      display: none !important;
    }

    :host([hide-label]) [part~='label'] {
      display: none;
    }
  `,
];
