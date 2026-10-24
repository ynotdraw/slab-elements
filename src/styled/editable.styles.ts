import { css } from 'lit';

/*
  The button takes the input's box, border and padding, with the border
  transparent until it's hovered, so the text doesn't move when editing
  starts.
*/
export default css`
  [part~='preview'] {
    align-items: center;
    background-color: transparent;
    block-size: 3rem;
    border: 2px dashed transparent;
    border-radius: 0;
    box-sizing: border-box;
    color: inherit;
    cursor: text;
    display: flex;
    font: inherit;
    gap: 0.5rem;
    padding: 0 0.75rem;
    text-align: start;
    transition:
      background-color 100ms,
      border-color 100ms,
      box-shadow 100ms,
      translate 100ms;

    /* The pencil: what a click does. */
    &::after {
      color: var(--ash);
      content: '✎' / '';
      margin-inline-start: auto;
    }

    &:hover {
      background-color: var(--chalk);
      border-color: var(--ash);
    }

    &:focus-visible {
      border-color: var(--ink);
      border-style: solid;
      box-shadow: 4px 4px 0 var(--ember);
      outline: 2px solid transparent;
      translate: -2px -2px;
    }

    &:disabled {
      color: var(--ash);
      cursor: not-allowed;

      &::after {
        content: none;
      }

      &:hover {
        background-color: transparent;
        border-color: transparent;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  :host(:state(empty)) [part~='preview'] {
    color: var(--ash);
  }
`;
