import { css } from 'lit';

/* A closed card isn't displayed, so the entrance runs each time it opens. */
export default css`
  [part~='card'] {
    animation: drop 150ms ease-out;
    background-color: var(--paper);
    border: var(--border);
    box-shadow: var(--shadow);
    color: var(--ink);
    font-family: var(--font-body);
    line-height: 1.5;
    margin: 0.5rem;
    max-inline-size: 20rem;
    padding: 1rem 1.25rem;
  }

  @keyframes drop {
    from {
      opacity: 0;
      translate: 0 -0.375rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part~='card'] {
      animation: none;
    }
  }
`;
