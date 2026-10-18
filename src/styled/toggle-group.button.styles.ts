import { css } from 'lit';

export default css`
  :host {
    color: var(--ink);
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    padding: 0.5rem 0.875rem;
    text-transform: uppercase;
    transition:
      background-color 100ms,
      color 100ms;
  }

  :host(:hover) {
    background-color: var(--chalk);
  }

  /*
    Inside the group's border rather than over it, so the ring isn't cut off
    by the buttons on either side.
  */
  :host(:focus-visible) {
    outline: 3px solid var(--ember);
    outline-offset: -5px;
  }

  /*
    As specific as the hover above, and after it, so a pressed button keeps
    its ember while it's hovered. Paper text on "--ember-deep" is 5.7:1 and
    7.4:1, where on "--ember" it would fall short for small text.
  */
  :host(:state(pressed)) {
    background-color: var(--ember-deep);
    color: var(--paper);
  }

  :host(:state(pressed):focus-visible) {
    outline-color: var(--paper);
  }

  :host(:state(disabled)) {
    background-color: transparent;
    color: var(--ash);
    cursor: not-allowed;
    text-decoration: line-through;
  }

  @media (prefers-reduced-motion: reduce) {
    :host {
      transition: none;
    }
  }
`;
