import { css } from 'lit';

export default css`
  /* A closed popover isn't displayed, so this runs each time it opens. */
  [part~='popover'] {
    animation: drop 150ms ease-out;
    background-color: var(--paper);
    border: var(--border);
    box-shadow: var(--shadow);
    color: var(--ink);
    font-family: var(--font-body);
    margin: 0.5rem 0;
    min-inline-size: 12rem;
    padding: 0.25rem 0;
  }

  /*
    A submenu opens beside its Menu Item, overlapping its Menu's edge a little,
    with its first Menu Item level with the one that opened it.
  */
  :host(:state(submenu)) [part~='popover'] {
    margin: calc(-0.25rem - 2px) -0.25rem;
  }

  /*
    The menu is focused for as long as it's open, and the active Menu Item is
    what shows where the keyboard is, so the menu itself has no outline.
  */
  [part~='menu']:focus {
    outline: none;
  }

  @keyframes drop {
    from {
      opacity: 0;
      translate: 0 -0.375rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part~='popover'] {
      animation: none;
    }
  }
`;
