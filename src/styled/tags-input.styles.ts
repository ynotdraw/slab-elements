import { css } from 'lit';

/*
  Text Field's input, with the tags as bordered chips above it, as Combobox's
  are with "multiple".
*/
export default css`
  /*
    The tags sit in a row between the label and the input, rather than inside
    it, so the input keeps Text Field's fixed height.
  */
  [part~='tags'] {
    column-gap: 0.375rem;
    display: flex;
    flex-wrap: wrap;
  }

  [part~='tag'] {
    align-items: center;
    background-color: var(--paper);
    border: var(--border);
    border-radius: 0;
    color: var(--ink);
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    gap: 0.5rem;

    /* Below each tag rather than below the row, so no tags take no room. */
    margin-block-end: 0.375rem;
    padding: 0.125rem 0.5rem;
    transition:
      background-color 100ms,
      color 100ms;

    /* The cross: what a click does. */
    &::after {
      content: '×' / '';
      font-size: 1.125rem;
      line-height: 1;
    }

    &:hover {
      background-color: var(--chalk);
    }

    &:focus-visible {
      background-color: var(--ember-deep);
      color: var(--paper);
      outline: 2px solid transparent;
    }

    &:disabled {
      background-color: var(--chalk);
      border-style: dashed;
      color: var(--ash);
      cursor: not-allowed;
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }
`;
