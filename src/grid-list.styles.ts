import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A custom element is inline by default, and the
      grid list holds rows.
    */
    :host {
      display: block;
    }
  `,
];
