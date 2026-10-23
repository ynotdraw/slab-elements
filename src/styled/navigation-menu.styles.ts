import { css } from 'lit';

/*
  The links in the row are slotted in, so they're styled through
  "::slotted()". Each Item styles its own button to match.
*/
export default css`
  [part~='list'] {
    background-color: var(--paper);
    border: var(--border);
    box-shadow: var(--shadow);
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    inline-size: fit-content;
    list-style: none;
    margin: 0;
    padding: 0.25rem;
  }

  ::slotted(a) {
    border: 2px solid transparent;
    color: var(--ink);
    display: block;
    font-family: var(--font-display);
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    padding: 0.375rem 0.75rem;
    text-decoration: none;
    text-transform: uppercase;
  }

  ::slotted(a:hover) {
    background-color: var(--chalk);
  }

  ::slotted(a:focus-visible) {
    outline: 3px solid var(--ember);
    outline-offset: 2px;
  }

  ::slotted([aria-current='page']) {
    text-decoration-color: var(--ember);
    text-decoration-line: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 0.3em;
  }
`;
