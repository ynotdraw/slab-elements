import { css } from 'lit';

/*
  Focus is on a row, or on a control in one, so the box has no focus style
  of its own.
*/
export default css`
  [part~='grid'] {
    background-color: var(--paper);
    border: var(--border);
    box-shadow: var(--shadow);
    color: var(--ink);
    font-family: var(--font-body);
  }
`;
