import { css } from 'lit';

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
    margin-block-end: 0.5rem;
  }

  :host(:state(required)) [part~='label']::after {
    color: var(--ember-deep);
    content: ' *' / '';
  }

  [part~='stars'] {
    display: flex;
    gap: 0.375rem;
  }

  [part~='star'] {
    appearance: none;
    background-color: var(--paper);
    block-size: 1.5rem;
    border: var(--border);
    border-radius: 0;
    box-sizing: border-box;
    cursor: pointer;
    inline-size: 2.75rem;
    margin: 0;

    &:focus-visible {
      outline: 3px solid var(--ember);
      outline-offset: 3px;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  /*
    Half steps split each brick in two, butted together across the gap,
    with a thin seam between the halves.
  */
  [part~='start'] {
    border-inline-end-width: 1px;
    inline-size: 1.375rem;
  }

  [part~='end'] {
    border-inline-start-width: 1px;
    inline-size: 1.375rem;
    margin-inline-start: -0.375rem;
  }

  [part~='filled'] {
    background-color: var(--ember);
  }

  /*
    A lighter course while previewing, so what's hovered reads as a
    preview rather than as the value.
  */
  :host(:state(previewing)) [part~='filled'] {
    background-color: color-mix(in srgb, var(--ember) 55%, var(--paper));
  }

  /*
    Forced colors replace a mix, which isn't a system color, so a preview is
    the highlight with a dashed edge instead.
  */
  @media (forced-colors: active) {
    :host(:state(previewing)) [part~='filled'] {
      background-color: var(--ember);
      border-style: dashed;
    }
  }

  /*
    Spaced by what's in it rather than by a gap, so a description with
    nothing in it takes no room.
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
`;
