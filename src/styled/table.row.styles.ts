import { css } from 'lit';

/*
  The check box of a selectable Table is a native one, drawn square like Grid
  List's: an ink border, filled with ember inside a ring of paper when it's
  checked, and with a bar of ember when only some rows are.
*/
export default css`
  :host {
    border-block-end: 1px solid var(--ash);
  }

  :host(:last-child) {
    border-block-end: none;
  }

  :host(:state(selected)) {
    background-color: var(--chalk);
  }

  :host(:state(disabled)) {
    color: var(--ash);
  }

  [part~='selection-cell'] {
    inline-size: 1px;
    padding-block: 0.625rem;
    padding-inline: 0.75rem 0;
    vertical-align: middle;
  }

  [part~='checkbox'] {
    appearance: none;
    background-color: var(--paper);
    block-size: 1rem;
    border: var(--border);
    box-sizing: border-box;
    cursor: pointer;
    display: block;
    inline-size: 1rem;
    margin: 0;

    &:checked {
      background: linear-gradient(var(--ember), var(--ember));
      border-color: var(--ember);
      box-shadow: inset 0 0 0 2px var(--paper);
    }

    &:indeterminate {
      background: linear-gradient(var(--ember), var(--ember)) center / 0.5rem
        2px no-repeat;
    }

    &:disabled {
      border-color: var(--ash);
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: 3px solid var(--ember);
      outline-offset: 2px;
    }

    /* The system's own, which forced colors can draw. */
    @media (forced-colors: active) {
      appearance: auto;
    }
  }
`;
