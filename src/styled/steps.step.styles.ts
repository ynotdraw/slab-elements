import { css } from 'lit';

/*
  The square, the label and the rule to the next Step sit side by side in a
  grid, and the description goes below the label. When its Steps stacks into
  a column, the rule runs down from the square instead.

  "::part(step)" is a button when its Steps is navigable, so it's reset to
  look like the "<div>" it is otherwise.
*/
export default css`
  :host {
    color: var(--ink);
    column-gap: 0.75rem;
    display: grid;
    grid-template-columns: 2.5rem auto minmax(1rem, 1fr);
  }

  [part~='step'] {
    align-items: center;
    background: none;
    border: none;
    color: inherit;
    column-gap: inherit;
    display: grid;
    font: inherit;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    margin: 0;
    padding: 0;
    text-align: start;

    &::after {
      border-block-start: 2px dashed var(--ash);
      content: '';
    }

    &:focus-visible {
      outline: 3px solid var(--ember);
      outline-offset: 3px;
    }
  }

  :host(:last-child) [part~='step']::after {
    display: none;
  }

  :host(:state(complete)) [part~='step']::after {
    border-block-start: 2px solid var(--ink);
  }

  :host(:state(navigable)) [part~='step'] {
    cursor: pointer;
  }

  :host(:state(navigable)[disabled]) [part~='step'] {
    cursor: not-allowed;
  }

  :host(:state(navigable):not([disabled]):hover) [part~='label'] {
    text-decoration-color: var(--ember);
    text-decoration-line: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 0.3em;
  }

  [part~='indicator'] {
    background-color: var(--paper);
    block-size: 2.5rem;
    border: var(--border);
    box-shadow: 3px 3px 0 var(--ink);
    box-sizing: border-box;
    display: grid;
    font-family: var(--font-display);
    font-size: 1.0625rem;
    font-weight: 700;
    inline-size: 2.5rem;
    place-items: center;
  }

  [part~='label'] {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    overflow-wrap: anywhere;
    text-transform: uppercase;
  }

  [part~='description'] {
    color: var(--ash);
    font-family: var(--font-body);
    font-size: 0.875rem;
    grid-column: 2 / -1;
    line-height: 1.4;
  }

  /* The number gives way to a check. */
  :host(:state(complete)) [part~='indicator'] {
    background-color: var(--ink);
    color: var(--paper);
    font-size: 0;

    &::before {
      content: '✓';
      font-size: 1.25rem;
    }
  }

  /* Deep rather than plain ember, for the number's contrast. */
  :host(:state(current)) [part~='indicator'] {
    background-color: var(--ember-deep);
    color: var(--paper);
  }

  :host(:state(upcoming)) [part~='indicator'] {
    border-style: dashed;
    box-shadow: none;
    color: var(--ash);
  }

  :host(:state(upcoming)) [part~='label'] {
    color: var(--ash);
  }

  @container (inline-size < 36rem) {
    :host {
      grid-template-columns: 2.5rem minmax(0, 1fr);
    }

    [part~='step']::after {
      display: none;
    }

    /* Down from the square, past the description, to the next Step's. */
    :host(:not(:last-child))::after {
      border-inline-start: 2px dashed var(--ash);
      content: '';
      grid-column: 1;
      grid-row: 2 / span 2;
      justify-self: center;
      margin-block: 0.375rem 0.125rem;
      min-block-size: 1.5rem;
    }

    :host(:state(complete):not(:last-child))::after {
      border-inline-start: 2px solid var(--ink);
    }
  }
`;
