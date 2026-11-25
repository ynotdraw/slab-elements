import { css } from 'lit';
import visuallyHidden from './library/visually-hidden.js';

export default [
  css`
    /*
      Functional, not visual. A custom element is inline by default, and this
      lays its Cells out as a "<tr>" does.
    */
    :host {
      display: table-row;
    }

    /*
      Functional, not visual. The check box's Cell, in a selectable Table, is
      one of the row's columns.
    */
    [part~='selection-cell'] {
      display: table-cell;
    }
  `,
  css`
    /*
      Functional, not visual. A Column Header needs a name, and there's no
      select-all check box to give it one.
    */
    ${visuallyHidden("[part~='selection-label']")}
  `,
];
