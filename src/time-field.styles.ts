import { css } from 'lit';
import visuallyHidden from './library/visually-hidden.js';

export default [
  css`
    /*
      Functional, not visual. A hidden label still names the field, so it's
      hidden visually rather than removed.
    */
    ${visuallyHidden(":host([hide-label]) [part~='label']")}
  `,
];
