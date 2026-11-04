import { css } from 'lit';

/*
  The row itself takes focus, so its outline is drawn inside it, where the
  rows around it and the Grid List's border can't cover it. The controls are
  the consumer's own, slotted in, so they're styled through "::slotted()".
*/
export default css`
  :host {
    cursor: default;
    transition: background-color 100ms;
  }

  :host(:not(:first-child)) {
    border-block-start: 2px solid var(--chalk);
  }

  :host(:hover) {
    background-color: var(--chalk);
  }

  :host(:focus-visible) {
    outline: 3px solid var(--ember);
    outline-offset: -3px;
  }

  :host(:state(selectable)) {
    cursor: pointer;
  }

  :host(:state(disabled)) {
    color: var(--ash);
    cursor: not-allowed;
  }

  [part~='cell'] {
    align-items: center;
    display: flex;
    gap: 0.75rem;
    min-block-size: 2.75rem;
    padding: 0.375rem 0.75rem;
  }

  /*
    The check box, which only shows. The row is what's selected, and a
    screenreader hears that from it.
  */
  :host(:state(selectable)) [part~='cell']::before {
    block-size: 1rem;
    border: var(--border);
    box-sizing: border-box;
    content: '';
    flex: none;
    inline-size: 1rem;
  }

  /* Filled with ember, inside a ring of paper. */
  :host(:state(selectable):state(selected)) [part~='cell']::before {
    background: linear-gradient(var(--ember), var(--ember));
    border-color: var(--ember);
    box-shadow: inset 0 0 0 2px var(--paper);
  }

  :host(:state(selectable):state(disabled)) [part~='cell']::before {
    border-color: var(--ash);
  }

  /* What the row is about fills it, pushing the controls to its end. */
  ::slotted(:first-child) {
    flex: 1 1 auto;
    min-inline-size: 0;
  }

  ::slotted(button) {
    background-color: transparent;
    border: 2px solid var(--ink);
    color: var(--ink);
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    padding: 0.125rem 0.5rem;
    text-transform: uppercase;
  }

  ::slotted(button:hover) {
    background-color: var(--ink);
    color: var(--paper);
  }

  ::slotted(a) {
    color: var(--ember-deep);
    font-weight: 600;
  }

  ::slotted(:focus-visible) {
    outline: 3px solid var(--ember);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    :host {
      transition: none;
    }
  }
`;
