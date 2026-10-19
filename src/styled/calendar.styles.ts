import { css } from 'lit';

/*
  The previous and next buttons' text is their accessible name, so it stays,
  at no size, and a chevron is drawn in its place.
*/
export default css`
  :host {
    background-color: var(--paper);
    border: var(--border);
    box-shadow: var(--shadow);
    color: var(--ink);
    display: inline-block;
    font-family: var(--font-body);
    padding: 1rem;
  }

  [part~='header'] {
    align-items: center;
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    margin-block-end: 0.75rem;
  }

  [part~='heading'] {
    font-family: var(--font-display);
    font-size: 1.125rem;
    font-weight: 600;
  }

  [part~='previous'],
  [part~='next'] {
    align-items: center;
    background-color: var(--paper);
    block-size: 2.25rem;
    border: var(--border);
    color: var(--ink);
    cursor: pointer;
    display: flex;
    font-size: 0;
    inline-size: 2.25rem;
    justify-content: center;
    padding: 0;
    transition: background-color 100ms;

    &::before {
      block-size: 0.5rem;
      border-block-end: 2px solid currentcolor;
      border-inline-start: 2px solid currentcolor;
      content: '';
      inline-size: 0.5rem;
      rotate: 45deg;
      translate: 0.125rem 0;
    }

    &:hover {
      background-color: var(--chalk);
    }

    &:focus-visible {
      outline: 3px solid var(--ember);
      outline-offset: 2px;
    }
  }

  [part~='next']::before {
    rotate: -135deg;
    translate: -0.125rem 0;
  }

  /*
    Separate rather than collapsed, so each day draws its own border whole.
    Collapsed, a day's border merges with its neighbors' and today's ring
    breaks up.
  */
  [part~='grid'] {
    border-collapse: separate;
    border-spacing: 0;
  }

  [part~='weekday'] {
    color: var(--ash);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 400;
    padding-block-end: 0.375rem;
    text-transform: uppercase;
  }

  [part~='day'] {
    block-size: 2.5rem;
    border: 2px solid transparent;
    box-sizing: border-box;
    cursor: pointer;
    inline-size: 2.5rem;
    text-align: center;
    transition:
      background-color 100ms,
      color 100ms;

    &:hover {
      background-color: var(--chalk);
    }

    &:focus-visible {
      outline: 3px solid var(--ember);
      outline-offset: -3px;
    }
  }

  [part~='today'] {
    border-color: var(--ember);
  }

  /*
    The ring is inside the day, so on the selected one it's on ink, where
    ember falls short of 3:1 in the dark. The text's color always has the
    contrast.
  */
  [part~='selected'] {
    background-color: var(--ink);
    color: var(--paper);
    font-weight: 600;

    &:hover {
      background-color: var(--ink);
    }

    &:focus-visible {
      outline-color: currentcolor;
    }
  }

  /*
    While a range is being picked, the days it would cover are hatched, so
    they don't read as chosen yet. Once it's picked, they're a band of chalk
    between its ends, which are ink like a single selected day.
  */
  [part~='preview'] {
    background-image: repeating-linear-gradient(
      -45deg,
      var(--chalk) 0 4px,
      transparent 4px 8px
    );
  }

  :host([range]) [part~='selected'] {
    background-color: var(--chalk);
    background-image: none;
    color: var(--ink);
    font-weight: 400;

    &:hover {
      background-color: var(--chalk);
    }

    &:focus-visible {
      outline-color: var(--ember);
    }
  }

  :host([range]) [part~='range-start'],
  :host([range]) [part~='range-end'] {
    background-color: var(--ink);
    color: var(--paper);
    font-weight: 600;

    &:hover {
      background-color: var(--ink);
    }

    &:focus-visible {
      outline-color: currentcolor;
    }
  }

  [part~='disabled'] {
    color: var(--ash);
    cursor: not-allowed;
    text-decoration: line-through;

    &:hover {
      background-color: transparent;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part~='previous'],
    [part~='next'],
    [part~='day'] {
      transition: none;
    }
  }
`;
