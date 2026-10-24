import { css } from 'lit';

/*
  The articles are slotted in, so they're styled through "::slotted()". Their
  headings and text are the consumer's own and inherit the article's type.
*/
export default css`
  :host {
    color: var(--ink);
    font-family: var(--font-body);
  }

  [part~='feed'] {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: opacity 150ms;
  }

  :host([busy]) [part~='feed'] {
    opacity: 0.6;
  }

  ::slotted(*) {
    background-color: var(--paper);
    border: var(--border);
    box-shadow: var(--shadow);
    padding: 1rem 1.25rem;
  }

  ::slotted(:focus-visible) {
    outline: 3px solid var(--ember);
    outline-offset: 3px;
  }
`;
