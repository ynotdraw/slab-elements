import { css } from 'lit';

/*
  Text Field's input, with the listbox in a panel beside it like Select's,
  and the tags of "multiple" as bordered chips above it.
  The listbox is a popover, so a closed one isn't displayed, and its entrance
  runs each time it opens.
*/
export default css`
  [part~='listbox'] {
    animation: drop 150ms ease-out;
    background-color: var(--paper);
    border: var(--border);
    box-shadow: var(--shadow);
    box-sizing: border-box;
    color: var(--ink);
    margin-block: 0.5rem;
    max-block-size: 18rem;
    min-inline-size: anchor-size(inline);
    overflow-y: auto;
    padding: 0.25rem 0;
  }

  /*
    With "multiple", the tags sit in a row between the label and the input,
    rather than inside it, so the input keeps Text Field's fixed height.
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
  }

  @keyframes drop {
    from {
      opacity: 0;
      translate: 0 -0.375rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part~='listbox'] {
      animation: none;
    }

    [part~='tag'] {
      transition: none;
    }
  }
`;
