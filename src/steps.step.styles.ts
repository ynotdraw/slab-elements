import { css } from 'lit';
import visuallyHidden from './library/visually-hidden.js';

export default [
  css`
    /*
      Functional, not visual. The status is for screenreaders, which have no
      other way to tell a complete Step from an upcoming one, so it's hidden
      visually rather than removed.
    */
    ${visuallyHidden("[part~='status']")}
  `,
];
