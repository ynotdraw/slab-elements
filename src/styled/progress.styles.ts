import { css } from 'lit';

/*
  The bricks are a repeating gradient: 1.5rem of ember and a 0.25rem joint of
  paper, the logo's proportions near enough.
*/
export default css`
  :host {
    color: var(--ink);
    display: grid;
    font-family: var(--font-body);
    gap: 0.5rem;
  }

  [part~='label'] {
    font-family: var(--font-display);
    font-size: 1.0625rem;
    font-weight: 600;
  }

  [part~='progress'] {
    appearance: none;
    background-color: var(--paper);
    block-size: 1.375rem;
    border: var(--border);
    box-sizing: border-box;
    inline-size: 100%;
    padding: 2px;

    &::-webkit-progress-bar {
      background-color: transparent;
    }

    &::-webkit-progress-value {
      background: repeating-linear-gradient(
        to right,
        var(--ember) 0 1.5rem,
        transparent 1.5rem 1.75rem
      );
      transition: inline-size 200ms;
    }

    &::-moz-progress-bar {
      background: repeating-linear-gradient(
        to right,
        var(--ember) 0 1.5rem,
        transparent 1.5rem 1.75rem
      );
    }
  }

  /*
    The bricks are one tile, a brick and its gap, repeated across. The march
    moves them by exactly that tile, so each loop picks up where the last one
    left off. A gradient as wide as the bar would wrap at the bar's width,
    which isn't a multiple of the tile, and a brick would jump at the start.
  */
  :host(:state(indeterminate)) [part~='progress'] {
    animation: march 600ms linear infinite;
    background:
      linear-gradient(
          to right,
          var(--ember) 0 1.5rem,
          transparent 1.5rem 3.5rem
        )
        0 0 / 3.5rem 100% repeat-x content-box,
      var(--paper);

    &::-moz-progress-bar {
      background: transparent;
    }
  }

  @keyframes march {
    to {
      background-position-x: 3.5rem, 0;
    }
  }

  /*
    Forced colors drop gradients, and the bricks are one. Their colors are
    system colors there, so they can keep them.
  */
  @media (forced-colors: active) {
    [part~='progress'] {
      forced-color-adjust: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :host(:state(indeterminate)) [part~='progress'] {
      animation: none;
    }

    [part~='progress']::-webkit-progress-value {
      transition: none;
    }
  }
`;
