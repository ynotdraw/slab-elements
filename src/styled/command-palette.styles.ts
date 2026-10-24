import { css } from 'lit';

/*
  Dialog's styles, then these. It sits in the upper part of the page rather
  than its middle, so the list grows down without the input moving, and the
  input and list run to the slab's edges.
*/
export default css`
  [part~='dialog'] {
    inline-size: min(36rem, 100% - 2rem);
    margin-block-start: 12vh;
    padding: 0;
  }

  [part~='label'] {
    margin: 0;
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
