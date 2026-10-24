import { css } from 'lit';

export default css`
  [part~='control'] {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
  }

  /*
    Butted against the input, sharing its border, at the same fixed height.
    Pressed, it's filled in, so the state shows without the text changing.
  */
  [part~='toggle-button'] {
    background-color: var(--paper);
    block-size: 3rem;
    border: var(--border);
    border-radius: 0;
    color: inherit;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    letter-spacing: 0.06em;
    margin-inline-start: -2px;
    padding: 0 0.875rem;
    text-transform: uppercase;
    transition:
      background-color 100ms,
      box-shadow 100ms,
      color 100ms,
      translate 100ms;

    &:hover {
      background-color: var(--chalk);
    }

    /*
      The outline is transparent rather than gone, so it still shows in forced
      colors, where box shadows don't.
    */
    &:focus-visible {
      box-shadow: 4px 4px 0 var(--ember);
      outline: 2px solid transparent;
      translate: -2px -2px;
    }

    &:disabled {
      background-color: var(--chalk);
      border-style: dashed;
      color: var(--ash);
      cursor: not-allowed;
    }
  }

  :host(:state(revealed)) [part~='toggle-button'] {
    background-color: var(--ink);
    color: var(--paper);
  }

  :host(:state(error)) [part~='toggle-button'] {
    border-color: var(--ember-deep);
  }

  @media (prefers-reduced-motion: reduce) {
    [part~='toggle-button'] {
      transition: none;
    }
  }
`;
