import { css } from 'lit';

/*
  The track is 0.875rem with its border, and the thumb 1.875rem. Chromium
  and WebKit put the thumb at the top of the track's content box rather than
  centering it, so it's pulled up by the difference.
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

  [part~='input'] {
    appearance: none;
    background: transparent;
    block-size: 1.875rem;
    cursor: pointer;
    inline-size: 100%;
    margin: 0;

    &::-webkit-slider-runnable-track {
      background: linear-gradient(
        to right,
        var(--ember) var(--fill, 50%),
        var(--paper) var(--fill, 50%)
      );
      block-size: 0.875rem;
      border: var(--border);
      box-sizing: border-box;
    }

    &::-moz-range-track {
      background-color: var(--paper);
      block-size: 0.875rem;
      border: var(--border);
      box-sizing: border-box;
    }

    &::-moz-range-progress {
      background-color: var(--ember);
      block-size: 0.875rem;
      border: var(--border);
      border-inline-end: 0;
      box-sizing: border-box;
    }

    &::-webkit-slider-thumb {
      appearance: none;
      background-color: var(--ink);
      block-size: 1.875rem;
      border: 2px solid var(--paper);
      border-radius: 0;
      box-shadow: 0 0 0 2px var(--ink);
      inline-size: 1rem;
      margin-block-start: calc((0.875rem - 4px - 1.875rem) / 2);
    }

    &::-moz-range-thumb {
      background-color: var(--ink);
      block-size: 1.875rem;
      border: 2px solid var(--paper);
      border-radius: 0;
      box-shadow: 0 0 0 2px var(--ink);
      box-sizing: border-box;
      inline-size: 1rem;
    }

    &:focus-visible {
      outline: none;
    }

    &:focus-visible::-webkit-slider-thumb {
      outline: 3px solid var(--ember);
      outline-offset: 3px;
    }

    &:focus-visible::-moz-range-thumb {
      outline: 3px solid var(--ember);
      outline-offset: 3px;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  [part~='description'] {
    color: var(--ash);
    display: block;
    font-size: 0.875rem;
  }

  [part~='validity-message'] {
    color: var(--ember-deep);
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    margin-block-start: 0.375rem;

    &::before {
      content: '■ ' / '';
    }
  }
`;
