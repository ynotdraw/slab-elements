import { css } from 'lit';

export default css`
  :host {
    align-items: center;
    color: var(--ink);
    column-gap: 1rem;
    display: grid;
    font-family: var(--font-body);
    grid-template-columns: 1fr auto;
  }

  :host(:state(disabled)) {
    color: var(--ash);
  }

  [part~='label'] {
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 1.0625rem;
    font-weight: 600;
  }

  :host(:state(required)) [part~='label']::after {
    color: var(--ember-deep);
    content: ' *' / '';
  }

  [part~='switch'] {
    display: flex;
  }

  /*
    The input is the track, and the thumb is a square of background drawn on
    it, so there's nothing to position and nothing else to focus.
  */
  [part~='input'] {
    appearance: none;
    background:
      linear-gradient(var(--ink), var(--ink)) no-repeat 0.25rem 50% / 1.125rem
        1.125rem,
      var(--paper);
    block-size: 1.75rem;
    border: var(--border);
    cursor: pointer;
    inline-size: 3.25rem;
    margin: 0;
    transition: background 150ms;

    &:focus-visible {
      outline: 3px solid var(--ember);
      outline-offset: 2px;
    }

    &:checked {
      background:
        linear-gradient(var(--paper), var(--paper)) no-repeat
          calc(100% - 0.25rem) 50% / 1.125rem 1.125rem,
        var(--ember);
    }

    &:disabled {
      border-style: dashed;
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  :host(:state(error)) [part~='input'] {
    border-color: var(--ember-deep);
    box-shadow: 2px 2px 0 var(--ember-deep);
  }

  [part~='description'] {
    color: var(--ash);
    display: block;
    font-size: 0.875rem;
    grid-column: 1 / -1;
  }

  [part~='validity-message'] {
    color: var(--ember-deep);
    display: block;
    font-weight: 600;
  }

  /*
    Forced colors drop gradients, and the thumb is one. Its colors are system
    colors there, so it can keep them.
  */
  @media (forced-colors: active) {
    [part~='input'] {
      forced-color-adjust: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part~='input'] {
      transition: none;
    }
  }
`;
