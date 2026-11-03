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
      Chrome and Safari draw a clear button of their own in a search input, and
      Safari a magnifying glass. The field has a clear button already, so the
      browser's would be a second.
    */
    [part~='input'] {
      &::-webkit-search-cancel-button,
      &::-webkit-search-decoration {
        appearance: none;
      }
    }
  `,
];
