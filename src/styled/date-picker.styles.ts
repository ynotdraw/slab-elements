import { css } from 'lit';

/*
  The Calendar is in this shadow root rather than slotted, so its days are
  styled through the parts it exports, the way the styled Calendar styles
  them from inside its own.
*/
export default css`
  [part~='control'] {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
  }

  /*
    Butted against the input, sharing its border, at the same fixed height.
    Its text is its accessible name, so it stays, at no size, and a calendar
    is drawn in its place.
  */
  [part~='button'] {
    align-items: center;
    background-color: var(--paper);
    block-size: 3rem;
    border: var(--border);
    border-radius: 0;
    color: inherit;
    cursor: pointer;
    display: flex;
    font-size: 0;
    inline-size: 3rem;
    justify-content: center;
    margin-inline-start: -2px;
    padding: 0;
    transition:
      background-color 100ms,
      box-shadow 100ms,
      color 100ms,
      translate 100ms;

    &::before {
      block-size: 0.875rem;
      border: 2px solid currentcolor;
      border-block-start-width: 5px;
      content: '';
      inline-size: 1rem;
    }

    &:hover {
      background-color: var(--chalk);
    }

    /*
      The outline is transparent rather than gone, so it still shows in forced
      colors, where box shadows don't.
    */
    &:focus-visible {
      box-shadow: 4px 4px 0 var(--ember);
      outline: 2px solid transparent;
      translate: -2px -2px;
    }

    &:disabled {
      background-color: var(--chalk);
      border-style: dashed;
      color: var(--ash);
      cursor: not-allowed;
    }
  }

  :host([open]) [part~='button'] {
    background-color: var(--ink);
    color: var(--paper);
  }

  :host(:state(error)) [part~='button'] {
    border-color: var(--ember-deep);
  }

  /* A closed popover isn't displayed, so the entrance runs each time it opens. */
  [part~='popover'] {
    animation: drop 150ms ease-out;
    background-color: var(--paper);
    border: var(--border);
    box-shadow: var(--shadow);
    color: var(--ink);
    font-family: var(--font-body);
    margin-block: 0.5rem;
    padding: 1rem;
  }

  @keyframes drop {
    from {
      opacity: 0;
      translate: 0 -0.375rem;
    }
  }

  [part~='calendar']::part(header) {
    align-items: center;
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    margin-block-end: 0.75rem;
  }

  [part~='calendar']::part(heading) {
    font-family: var(--font-display);
    font-size: 1.125rem;
    font-weight: 600;
  }

  [part~='calendar']::part(previous),
  [part~='calendar']::part(next) {
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
  }

  [part~='calendar']::part(previous)::before,
  [part~='calendar']::part(next)::before {
    block-size: 0.5rem;
    border-block-end: 2px solid currentcolor;
    border-inline-start: 2px solid currentcolor;
    content: '';
    inline-size: 0.5rem;
    rotate: 45deg;
    translate: 0.125rem 0;
  }

  [part~='calendar']::part(next)::before {
    rotate: -135deg;
    translate: -0.125rem 0;
  }

  [part~='calendar']::part(previous):hover,
  [part~='calendar']::part(next):hover {
    background-color: var(--chalk);
  }

  [part~='calendar']::part(previous):focus-visible,
  [part~='calendar']::part(next):focus-visible {
    outline: 3px solid var(--ember);
    outline-offset: 2px;
  }

  /*
    Separate rather than collapsed, so each day draws its own border whole.
    Collapsed, a day's border merges with its neighbors' and today's ring
    breaks up.
  */
  [part~='calendar']::part(grid) {
    border-collapse: separate;
    border-spacing: 0;
  }

  [part~='calendar']::part(weekday) {
    color: var(--ash);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 400;
    padding-block-end: 0.375rem;
    text-transform: uppercase;
  }

  [part~='calendar']::part(day) {
    block-size: 2.5rem;
    border: 2px solid transparent;
    box-sizing: border-box;
    cursor: pointer;
    inline-size: 2.5rem;
    text-align: center;
    transition:
      background-color 100ms,
      color 100ms;
  }

  [part~='calendar']::part(day):hover {
    background-color: var(--chalk);
  }

  [part~='calendar']::part(day):focus-visible {
    outline: 3px solid var(--ember);
    outline-offset: -3px;
  }

  [part~='calendar']::part(today) {
    border-color: var(--ember);
  }

  /*
    The ring is inside the day, so on the selected one it's on ink, where
    ember falls short of 3:1 in the dark. The text's color always has the
    contrast.
  */
  [part~='calendar']::part(selected) {
    background-color: var(--ink);
    color: var(--paper);
    font-weight: 600;
  }

  [part~='calendar']::part(selected):focus-visible {
    outline-color: currentcolor;
  }

  [part~='calendar']::part(disabled) {
    color: var(--ash);
    cursor: not-allowed;
    text-decoration: line-through;
  }

  [part~='calendar']::part(disabled):hover {
    background-color: transparent;
  }

  @media (prefers-reduced-motion: reduce) {
    [part~='button'],
    [part~='popover'],
    [part~='calendar']::part(previous),
    [part~='calendar']::part(next),
    [part~='calendar']::part(day) {
      animation: none;
      transition: none;
    }
  }
`;
