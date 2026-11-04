import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A custom element is inline by default, and this
      lays its rows out as a "<tfoot>" does.
    */
    :host {
      display: table-footer-group;
    }
  `,
];
