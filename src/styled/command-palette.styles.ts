import { css } from 'lit';

/*
  Dialog's styles, then these. It sits in the upper part of the page rather
  than its middle, so the list grows down without the input moving, and the
  input and list run to the slab's edges. The Close button sits beside the
  input, in a row of its own, and everything else spans the row.
*/
export default css`
  [part~='dialog'] {
    inline-size: min(36rem, 100% - 2rem);
    margin-block-start: 12vh;
    padding: 0;
  }

  /*
    On the open host only. A closed dialog isn't displayed, and "display: grid"
    would show it.
  */
  :host([open]) [part~='dialog'] {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
  }

  [part~='label'],
  [part~='listbox'],
  [part~='empty'] {
    grid-column: 1 / -1;
  }

  [part~='label'] {
    margin: 0;
  }

  [part~='close'] {
    background-color: var(--paper);
    border: 0;
    border-block-end: var(--border);
    border-inline-start: var(--border);
    border-radius: 0;
    color: var(--ink);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0 1rem;
    transition:
      background-color 100ms,
      color 100ms;

    &:hover {
      background-color: var(--chalk);
    }

    &:focus-visible {
      background-color: var(--ember-deep);
      color: var(--paper);
      outline: 2px solid transparent;
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  [part~='input'] {
    background-color: var(--paper);
    block-size: 3.5rem;
    border: 0;
    border-block-end: var(--border);
    border-radius: 0;
    box-sizing: border-box;
    color: inherit;
    display: block;
    font: inherit;
    font-size: 1.125rem;
    inline-size: 100%;
    padding: 0 1.25rem;

    &::placeholder {
      color: var(--ash);
    }

    /*
      The ember bar under it is the focus ring, since the input is always
      focused while the palette is open. The outline is transparent rather
      than gone, so it still shows in forced colors.
    */
    &:focus-visible {
      border-block-end-color: var(--ember);
      outline: 2px solid transparent;
    }
  }

  [part~='listbox'] {
    max-block-size: min(20rem, 50vh);
    overflow-y: auto;
    padding: 0.25rem 0;
  }

  :host(:state(empty)) [part~='empty'] {
    color: var(--ash);
    padding: 1rem 1.25rem;
  }
`;
