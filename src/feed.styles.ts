import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A custom element is inline by default, and the
      feed it holds is a block.
    */
    :host {
      display: block;
    }
  `,
];
