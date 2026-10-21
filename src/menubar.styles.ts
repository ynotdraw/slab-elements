import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A custom element is inline by default, and the
      menubar holds a row of Menus.
    */
    :host {
      display: block;
    }
  `,
];
