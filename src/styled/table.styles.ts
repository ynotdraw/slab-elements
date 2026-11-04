import { css } from 'lit';

/*
  Collapsed borders, so each row's rule and the box's border meet rather than
  doubling up. Figures are tabular, so numbers line up down a column.
*/
export default css`
  :host {
    background-color: var(--paper);
    border: var(--border);
    border-collapse: collapse;
    box-shadow: var(--shadow);
    color: var(--ink);
    font-family: var(--font-body);
    font-size: 0.9375rem;
    font-variant-numeric: tabular-nums;
    inline-size: 100%;
    line-height: 1.4;
  }
`;
