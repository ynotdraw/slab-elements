import { css } from 'lit';

/*
  The grip sits at the start of each row, and the content fills the rest. The
  grip's dots are the handle's own, hidden from screenreaders, which read
  its name instead.
*/
export default css`
  :host {
    align-items: center;
    background-color: var(--paper);
    border: var(--border);
    box-shadow: var(--shadow);
    color: var(--ink);
    display: flex;
    font-family: var(--font-body);
    gap: 0.75rem;
    padding: 0.5rem 0.75rem 0.5rem 0.25rem;
    transition:
      box-shadow 100ms,
      translate 100ms;
  }

  :host(:state(grabbed)) {
    box-shadow: 6px 6px 0 var(--ember);
    translate: -2px -2px;
  }

  [part~='handle'] {
    align-items: center;
    align-self: stretch;
    background: none;
    border: none;
    color: var(--ash);
    cursor: grab;
    display: flex;
    flex: none;
    font: inherit;
    font-size: 1.25rem;
    justify-content: center;
    line-height: 1;
    margin: 0;
    min-block-size: 2.25rem;
    min-inline-size: 2rem;
    padding: 0;

    /* Six dots, in two columns. */
    &::before {
      content: '⠿' / '';
    }

    &:hover {
      color: var(--ink);
    }

    &:focus-visible {
      outline: 3px solid var(--ember);
      outline-offset: 2px;
    }
  }

  :host(:state(grabbed)) [part~='handle'] {
    color: var(--ember-deep);
    cursor: grabbing;
  }

  [part~='content'] {
    flex: 1 1 auto;
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }
`;
