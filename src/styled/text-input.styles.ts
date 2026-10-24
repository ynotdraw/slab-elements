import { css } from 'lit';

/*
  The look shared by everything typed into: Text Field, Password Field,
  Textarea, Number, Date Field, Time Field, Combobox and Tags Input, whose
  fields are "::part(input)", or "::part(textarea)" for Textarea. File Drop
  starts from it too, for its label and description.
*/
export default css`
  :host {
    color: var(--ink);
    display: grid;
    font-family: var(--font-body);
  }

  [part~='label'] {
    font-family: var(--font-display);
    font-size: 1.0625rem;
    font-weight: 600;
    margin-block-end: 0.375rem;
  }

  :host(:state(required)) [part~='label']::after {
    color: var(--ember-deep);
    content: ' *' / '';
  }

  [part~='input'],
  [part~='textarea'] {
    background-color: var(--paper);
    block-size: 3rem;
    border: var(--border);
    border-radius: 0;
    box-sizing: border-box;
    color: inherit;
    font: inherit;

    /* A fixed height, shared with Select, so fields line up in a row. */
    padding: 0 0.75rem;
    transition:
      background-color 100ms,
      border-color 100ms,
      box-shadow 100ms,
      translate 100ms;

    &::placeholder {
      color: var(--ash);
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

  [part~='textarea'] {
    block-size: auto;
    min-block-size: 7rem;
    padding: 0.625rem 0.75rem;
    resize: vertical;
  }

  :host(:state(readonly)) [part~='input'],
  :host(:state(readonly)) [part~='textarea'] {
    background-color: var(--chalk);
  }

  :host(:state(error)) [part~='input'],
  :host(:state(error)) [part~='textarea'] {
    border-color: var(--ember-deep);
  }

  /*
    Spaced by what's in it rather than by a gap, so a description with
    nothing in it takes no room, and a control beside the field lines up
    with its bottom edge.
  */
  [part~='description'] {
    color: var(--ash);
    display: grid;
    font-size: 0.875rem;
  }

  ::slotted([slot='description']) {
    margin-block-start: 0.375rem;
  }

  [part~='validity-message'] {
    color: var(--ember-deep);
    font-weight: 600;
    margin-block-start: 0.375rem;

    &::before {
      content: '■ ' / '';
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part~='input'],
    [part~='textarea'] {
      transition: none;
    }
  }
`;
