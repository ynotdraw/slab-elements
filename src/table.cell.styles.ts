import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A custom element is inline by default, and this
      lays it out as a "<td>" does.
    */
    :host {
      display: table-cell;
    }
  `,
];
