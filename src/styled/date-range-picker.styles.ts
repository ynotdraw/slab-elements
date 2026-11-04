import { css } from 'lit';

/*
  On top of Date Picker's styles. Each input has a small label above it, so
  the button isn't butted against an input the way Date Picker's is. It sits
  apart, at the inputs' height, level with them.
*/
export default css`
  [part~='control'] {
    align-items: end;
    column-gap: 0.75rem;
  }

  [part~='button'] {
    align-self: end;
    block-size: 3rem;
    box-sizing: border-box;
    margin-inline-start: 0;
  }

  /*
    As the styled Calendar draws a range: hatched while it's being picked, so
    the days don't read as chosen yet, then a band of chalk between its ends,
    which are ink like a single selected day.
  */
  [part~='calendar']::part(preview) {
    background-image: repeating-linear-gradient(
      -45deg,
      var(--chalk) 0 4px,
      transparent 4px 8px
    );
  }

  [part~='calendar']::part(selected),
  [part~='calendar']::part(selected):hover {
    background-color: var(--chalk);
    background-image: none;
    color: var(--ink);
    font-weight: 400;
  }

  [part~='calendar']::part(selected):focus-visible {
    outline-color: var(--ember);
  }

  [part~='calendar']::part(range-start),
  [part~='calendar']::part(range-end),
  [part~='calendar']::part(range-start):hover,
  [part~='calendar']::part(range-end):hover {
    background-color: var(--ink);
    color: var(--paper);
    font-weight: 600;
  }

  [part~='calendar']::part(range-start):focus-visible,
  [part~='calendar']::part(range-end):focus-visible {
    outline-color: currentcolor;
  }
`;
