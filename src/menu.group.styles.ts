import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A Menu Group is a block of its Menu's rows, as
      each Menu Item is.
    */
    :host {
      display: block;
    }

    :host([hide-label]) [part~='label'] {
      display: none;
    }
  `,
];
