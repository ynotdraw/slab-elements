import { css } from 'lit';
import visuallyHidden from './library/visually-hidden.js';

export default [
  css`
    /*
      Functional, not visual. The status is for assistive technology, which
      announces it. A design shows the same thing through ":state(copied)"
      and ":state(failed)".
    */
    ${visuallyHidden("[role='status']")}
  `,
];
