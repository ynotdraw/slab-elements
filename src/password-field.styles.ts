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
  css`
    /*
      Edge adds a reveal button of its own to a password input. The field has
      one already, so Edge's would be a second.
    */
    [part~='input'] {
      &::-ms-reveal {
        display: none;
      }
    }
  `,
];
