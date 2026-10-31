import { css } from 'lit';

export default css`
  :host {
    align-items: center;
    color: var(--ink);
    column-gap: 0.75rem;
    display: grid;
    font-family: var(--font-body);
    grid-template-columns: auto 1fr;
  }

  :host(:state(disabled)) {
    color: var(--ash);
  }

  [part~='checkbox'] {
    display: grid;
    position: relative;
  }

  /*
    24 pixels square, the smallest target WCAG 2.5.8 allows without counting
    the space around it.
  */
  [part~='input'] {
    appearance: none;
    background-color: var(--paper);
    block-size: 1.5rem;
    border: var(--border);
    cursor: pointer;
    inline-size: 1.5rem;
    margin: 0;
    transition:
      background-color 100ms,
      box-shadow 100ms;

    &:hover {
      box-shadow: 2px 2px 0 var(--ink);
    }

    &:focus-visible {
      outline: 3px solid var(--ember);
      outline-offset: 2px;
    }

    &:disabled {
      border-style: dashed;
      box-shadow: none;
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  :host(:state(checked)) [part~='input'],
  :host(:state(indeterminate)) [part~='input'] {
    background-color: var(--ember);
  }

  :host(:state(error)) [part~='input'] {
    border-color: var(--ember-deep);
    box-shadow: 2px 2px 0 var(--ember-deep);
  }

  /*
    The mark is a shape cut from paper with a mask, so it takes the theme's
    color. It's drawn on rather than shown: a clip slides off it from left to
    right, the way Glide Core's stroke draws on. Unchecking takes it away at
    once. It doesn't take clicks, so the input under it still does.
  */
  [part~='checkbox']::after {
    background-color: var(--paper);
    clip-path: inset(0 100% 0 0);
    content: '';
    inset: 2px;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3 8.25l3.25 3.25L13 4.5' fill='none' stroke='black' stroke-width='2.5'/%3E%3C/svg%3E")
      center / contain no-repeat;
    pointer-events: none;
    position: absolute;
  }

  :host(:state(checked)) [part~='checkbox']::after,
  :host(:state(indeterminate)) [part~='checkbox']::after {
    clip-path: inset(0);
    transition: clip-path 300ms cubic-bezier(0.32, 0, 0.67, 0);
  }

  :host(:state(indeterminate)) [part~='checkbox']::after {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3.5 8h9' fill='none' stroke='black' stroke-width='2.5'/%3E%3C/svg%3E");
  }

  [part~='label'] {
    cursor: pointer;
  }

  :host(:state(required)) [part~='label']::after {
    color: var(--ember-deep);
    content: ' *' / '';
  }

  [part~='description'] {
    color: var(--ash);
    font-size: 0.875rem;
    grid-column: 2;
  }

  [part~='validity-message'] {
    color: var(--ember-deep);
    font-weight: 600;
  }

  @media (prefers-reduced-motion: reduce) {
    [part~='input'],
    :host(:state(checked)) [part~='checkbox']::after,
    :host(:state(indeterminate)) [part~='checkbox']::after {
      transition: none;
    }
  }
`;
