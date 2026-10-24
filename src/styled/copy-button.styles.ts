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

    /*
      The mark. Its text is decorative, so it's given empty alternative text:
      the status beside the button already says the text was copied.
    */
    &::after {
      content: '⧉' / '';
      font-family: var(--font-mono);
      font-weight: 400;
    }

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
    }
  }

  /*
    Paper text on "--ember-deep" is 5.7:1 and 7.4:1, where on "--ember" it
    would fall short for small text.
  */
  :host(:state(copied)) [part~='button'] {
    background-color: var(--ember-deep);
    border-color: var(--ember-deep);
    color: var(--paper);

    &::after {
      content: '✓' / '';
    }
  }

  :host(:state(failed)) [part~='button']::after {
    content: '✕' / '';
  }

  @media (prefers-reduced-motion: reduce) {
    [part~='button'] {
      transition: none;
    }
  }
`;
