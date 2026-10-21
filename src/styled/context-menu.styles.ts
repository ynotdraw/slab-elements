import { css } from 'lit';
import menu from './menu.styles.js';

export default [
  menu,
  css`
    /* Menu's drops from its anchor. This one opens at a point, so no margin. */
    [part~='popover'] {
      margin: 0;
    }

    ::slotted([slot='target']) {
      border: 2px dashed var(--ash);
      display: grid;
      min-block-size: 8rem;
      padding: 1rem;
      place-items: center;
      user-select: none;
    }
  `,
];
