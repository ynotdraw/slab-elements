import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A custom element is inline by default, and a
      button is a box that's clicked as one.
    */
    :host {
      display: inline-block;
    }
  `,
];
