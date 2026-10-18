import { css } from 'lit';

/*
  The buttons are the consumer's own, slotted in, so they're styled through
  "::slotted()". Their "aria-pressed" is what shows one's pressed.
*/
export default css`
  [part~='group'] {
    background-color: var(--paper);
    border: var(--border);
    box-shadow: var(--shadow);
    display: flex;
    inline-size: fit-content;
  }

  :host([orientation='vertical']) [part~='group'] {
    flex-direction: column;
  }

  ::slotted(button) {
    background-color: transparent;
    border: 0;
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

  /* An ink rule between each pair, across the row or down the column. */
  ::slotted(button:not(:first-child)) {
    border-inline-start: var(--border);
  }

  :host([orientation='vertical']) ::slotted(button:not(:first-child)) {
    border-block-start: var(--border);
    border-inline-start: 0;
  }

  ::slotted(button:hover) {
    background-color: var(--chalk);
  }

  /*
    Inside the group's border rather than over it, so the ring isn't cut off
    by the buttons on either side.
  */
  ::slotted(button:focus-visible) {
    outline: 3px solid var(--ember);
    outline-offset: -5px;
  }

  /*
    As specific as the hover above, and after it, so a pressed button keeps
    its ember while it's hovered. Paper text on "--ember-deep" is 5.7:1 and
    7.4:1, where on "--ember" it would fall short for small text.
  */
  ::slotted(button[aria-pressed='true']) {
    background-color: var(--ember-deep);
    color: var(--paper);
  }

  ::slotted(button[aria-pressed='true']:focus-visible) {
    outline-color: var(--paper);
  }

  ::slotted(button:disabled) {
    background-color: transparent;
    color: var(--ash);
    cursor: not-allowed;
    text-decoration: line-through;
  }

  @media (prefers-reduced-motion: reduce) {
    ::slotted(button) {
      transition: none;
    }
  }
`;
