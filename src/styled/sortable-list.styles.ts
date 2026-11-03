import { css } from 'lit';

/*
  The items are a column with a little room between them, so each one's
  shadow shows.
*/
export default css`
  :host {
    color: var(--ink);
    font-family: var(--font-body);
  }

  [part~='list'] {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
`;
