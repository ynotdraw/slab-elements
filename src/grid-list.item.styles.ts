import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A custom element is inline by default, and a row
      is a block: its Grid List scrolls the focused one into view, and an
      inline box with nothing in it has nothing to scroll to or click.
    */
    :host {
      display: block;
    }
  `,
];
