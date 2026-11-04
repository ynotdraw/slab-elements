import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A custom element is inline by default, and this
      lays its Cells out as a "<tr>" does.
    */
    :host {
      display: table-row;
    }
  `,
];
