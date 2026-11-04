import { css } from 'lit';

/*
  "::part(sort-button)" is reset to look like the plain text of a Column
  Header that can't sort, and the arrow is drawn here rather than slotted.
*/
export default css`
  :host {
    font-family: var(--font-display);
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 0.625rem 0.75rem;
    text-align: start;
    text-transform: uppercase;
    vertical-align: bottom;
    white-space: nowrap;
  }

  [part~='sort-button'] {
    align-items: center;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    gap: 0.375rem;
    letter-spacing: inherit;
    margin: 0;
    padding: 0;
    text-align: inherit;
    text-transform: inherit;

    &:hover {
      text-decoration-color: var(--ember);
      text-decoration-line: underline;
      text-decoration-thickness: 2px;
      text-underline-offset: 0.3em;
    }

    &:focus-visible {
      outline: 3px solid var(--ember);
      outline-offset: 3px;
    }
  }

  [part~='sort-indicator'] {
    color: var(--ash);

    &::before {
      content: '↕';
    }
  }

  :host(:state(ascending)) [part~='sort-indicator'],
  :host(:state(descending)) [part~='sort-indicator'] {
    color: var(--ember-deep);
  }

  :host(:state(ascending)) [part~='sort-indicator']::before {
    content: '↑';
  }

  :host(:state(descending)) [part~='sort-indicator']::before {
    content: '↓';
  }
`;
