import { css } from 'lit';

/*
  Dialog's styles, then these. The label and description span the slab, and
  the Cancel button and the slotted action sit in a row under them, at its
  end edge, with Cancel first.
*/
export default css`
  /*
    On the open host only. A closed dialog isn't displayed, and "display: grid"
    would show it.
  */
  :host([open]) [part~='dialog'] {
    column-gap: 1rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
  }

  [part~='label'],
  [part~='description'] {
    grid-column: 1 / -1;
  }

  [part~='description'] {
    margin-block-end: 1.5rem;
  }

  [part~='cancel'] {
    background-color: var(--paper);
    border: var(--border);
    box-shadow: 4px 4px 0 var(--ink);
    color: var(--ink);
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    grid-column: 2;
    padding: 0.5rem 1.125rem;
    transition:
      background-color 150ms ease-out,
      box-shadow 150ms ease-out;

    &:hover {
      background-color: var(--chalk);
    }

    &:active {
      box-shadow: 1px 1px 0 var(--ink);
      transition-duration: 50ms;
    }

    &:focus-visible {
      outline: 3px solid var(--ember);
      outline-offset: 3px;
    }
  }

  ::slotted(:not([slot])) {
    grid-column: 3;
  }

  @media (prefers-reduced-motion: reduce) {
    [part~='cancel'] {
      transition: none;
    }
  }
`;
