import { css } from 'lit';

export default css`
  :host {
    border-inline-start: 4px solid transparent;
    cursor: pointer;
    padding: 0.5rem 0.875rem 0.5rem 0.75rem;
    transition:
      background-color 100ms,
      border-color 100ms,
      color 100ms;
  }

  :host(:state(active)) {
    background-color: var(--ink);
    border-inline-start-color: var(--ember);
    color: var(--paper);
  }

  /*
    Checkbox and radio Menu Items keep room for their mark whether or not
    they're checked, so their labels line up. The mark is decoration: the
    state is read from aria-checked.
  */
  :host([type='checkbox']),
  :host([type='radio']) {
    padding-inline-start: 2rem;
    position: relative;
  }

  :host(:state(checked))::before {
    content: '✓' / '';
    inset-inline-start: 0.75rem;
    position: absolute;
  }

  :host([type='radio']:state(checked))::before {
    content: '●' / '';
  }

  :host(:state(disabled)) {
    color: var(--ash);
    cursor: not-allowed;
    text-decoration: line-through;
  }

  :host(:state(disabled):state(active)) {
    background-color: var(--chalk);
    color: var(--ash);
  }

  @media (prefers-reduced-motion: reduce) {
    :host {
      transition: none;
    }
  }
`;
