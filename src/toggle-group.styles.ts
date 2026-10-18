import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A custom element is inline by default, and the
      group holds a row of buttons.
    */
    :host {
      display: block;
    }
  `,
];
