import { css } from 'lit';

export default css`
  [part~='button'] {
    align-items: center;
    background-color: var(--paper);
    border: var(--border);
    color: var(--ink);
    cursor: pointer;
    display: inline-flex;
    font-family: var(--font-display);
    font-size: 0.9375rem;
    font-weight: 600;
    gap: 0.5rem;
    letter-spacing: 0.04em;
    padding: 0.5rem 0.875rem;
    text-transform: uppercase;
    transition:
      background-color 100ms,
      color 100ms;

    &:hover {
      background-color: var(--chalk);
    }

    &:focus-visible {
      outline: 3px solid var(--ember);
      outline-offset: 2px;
    }

    &:disabled {
      border-color: var(--ash);
      color: var(--ash);
      cursor: not-allowed;
      text-decoration: line-through;
    }
  }

  /*
    After the hover above, so a pressed button keeps its ember while it's
    hovered. Paper text on "--ember-deep" is 5.7:1 and 7.4:1, where on
    "--ember" it would fall short for small text.
  */
  :host(:state(pressed)) [part~='button'] {
    background-color: var(--ember-deep);
    border-color: var(--ember-deep);
    color: var(--paper);

    &:disabled {
      background-color: var(--chalk);
      border-color: var(--ash);
      color: var(--ash);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part~='button'] {
      transition: none;
    }
  }
`;
