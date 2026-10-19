import { css } from 'lit';

/*
  The separator is an ink bar with a grip at its middle, drawn with a
  pseudo-element so it needs no markup. Its hit area is wider than the bar,
  so it's easy to grab.
*/
export default css`
  :host {
    background-color: var(--paper);
    border: var(--border);
    box-shadow: var(--shadow);
    color: var(--ink);
    font-family: var(--font-body);
  }

  [part~='primary'],
  [part~='secondary'] {
    padding: 1rem;
  }

  [part~='separator'] {
    align-items: center;
    background-color: var(--ink);
    cursor: col-resize;
    display: flex;
    inline-size: 0.5rem;
    justify-content: center;
    transition: background-color 100ms;

    &::before {
      background-color: var(--paper);
      block-size: 2rem;
      content: '';
      inline-size: 2px;
    }

    &:hover {
      background-color: var(--ember);
    }

    &:focus-visible {
      background-color: var(--ember);
      outline: 3px solid var(--ember);
      outline-offset: 2px;
    }
  }

  :host([orientation='horizontal']) [part~='separator'] {
    block-size: 0.5rem;
    cursor: row-resize;
    inline-size: auto;

    &::before {
      block-size: 2px;
      inline-size: 2rem;
    }
  }

  :host(:state(dragging)) [part~='separator'] {
    background-color: var(--ember);
  }

  :host(:state(disabled)) [part~='separator'] {
    background-color: var(--ash);
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    [part~='separator'] {
      transition: none;
    }
  }
`;
