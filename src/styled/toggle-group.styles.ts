import { css } from 'lit';

/*
  The row and the rules between its buttons. The buttons style themselves.
*/
export default css`
  [part~='group'] {
    background-color: var(--paper);
    border: var(--border);
    box-shadow: var(--shadow);
    display: flex;
    inline-size: fit-content;
  }

  :host([orientation='vertical']) [part~='group'] {
    flex-direction: column;
  }

  /* An ink rule between each pair, across the row or down the column. */
  ::slotted(:not(:first-child)) {
    border-inline-start: var(--border);
  }

  :host([orientation='vertical']) ::slotted(:not(:first-child)) {
    border-block-start: var(--border);
    border-inline-start: 0;
  }
`;
