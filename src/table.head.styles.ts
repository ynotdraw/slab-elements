import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A custom element is inline by default, and this
      lays its rows out as a "<thead>" does.
    */
    :host {
      display: table-header-group;
    }
  `,
];
