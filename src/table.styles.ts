import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A custom element is inline by default, and this
      lays out its Head, Body and Foot as a "<table>" does.
    */
    :host {
      display: table;
    }
  `,
];
