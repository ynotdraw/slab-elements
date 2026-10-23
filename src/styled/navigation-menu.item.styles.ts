import { css } from 'lit';

/*
  The content drops down below the button, over what's below the menu,
  rather than pushing it down.
*/
export default css`
  :host {
    position: relative;
  }

  [part~='trigger'] {
    align-items: center;
    background-color: transparent;
    border: 2px solid transparent;
    color: var(--ink);
    cursor: pointer;
    display: flex;
    font-family: var(--font-display);
    font-size: 0.9375rem;
    font-weight: 600;
    gap: 0.375rem;
    letter-spacing: 0.04em;
    padding: 0.375rem 0.75rem;
    text-transform: uppercase;

    /*
      The marker. Its text is decorative, so it's given empty alternative
      text: the button's expanded state already says whether it's open.
    */
    &::after {
      color: var(--ember);
      content: '▾' / '';
      transition: rotate 150ms;
    }

    &:hover {
      background-color: var(--chalk);
    }

    &:focus-visible {
      outline: 3px solid var(--ember);
      outline-offset: 2px;
    }
  }

  :host([open]) [part~='trigger'] {
    background-color: var(--ink);
    color: var(--paper);

    &::after {
      rotate: 180deg;
    }
  }

  /* Hidden while closed, so this runs each time it opens. */
  [part~='content'] {
    animation: drop 150ms ease-out;
    background-color: var(--paper);
    border: var(--border);
    box-shadow: var(--shadow);
    color: var(--ink);
    font-family: var(--font-body);
    inset-block-start: calc(100% + 0.5rem);
    inset-inline-start: -0.25rem;
    min-inline-size: 12rem;
    padding: 0.25rem 0;
    position: absolute;
    z-index: 1;
  }

  [part~='list'] {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  ::slotted(a) {
    border-inline-start: 4px solid transparent;
    color: var(--ink);
    display: block;
    padding: 0.5rem 0.875rem 0.5rem 0.75rem;
    text-decoration: none;
    transition:
      background-color 100ms,
      border-color 100ms,
      color 100ms;
  }

  ::slotted(a:hover),
  ::slotted(a:focus-visible) {
    background-color: var(--ink);
    border-inline-start-color: var(--ember);
    color: var(--paper);
    outline: none;
  }

  ::slotted([aria-current='page']) {
    font-weight: 600;
  }

  @keyframes drop {
    from {
      opacity: 0;
      translate: 0 -0.375rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part~='trigger']::after,
    ::slotted(a) {
      transition: none;
    }

    [part~='content'] {
      animation: none;
    }
  }
`;
