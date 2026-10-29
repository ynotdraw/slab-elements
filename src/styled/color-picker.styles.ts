import { css } from 'lit';

/*
  The thumbs are centered on their values, so at either end of a track half
  of one hangs off it. The area and the sliders are inset by half a thumb so
  they stay inside the host. A checkerboard sits under the alpha slider's
  gradient and the swatches, so a clear color reads as clear.
*/
export default css`
  :host {
    --checkerboard: repeating-conic-gradient(
        var(--chalk) 0 25%,
        var(--paper) 0 50%
      )
      0 0 / 0.75rem 0.75rem;

    color: var(--ink);
    display: grid;
    font-family: var(--font-body);
    max-inline-size: 20rem;
  }

  [part~='container'] {
    display: grid;
    gap: 0.75rem;
  }

  [part~='label'] {
    font-family: var(--font-display);
    font-size: 1.0625rem;
    font-weight: 600;
  }

  [part~='area'],
  [part~='hue'],
  [part~='alpha'] {
    border: var(--border);
    box-sizing: border-box;
    cursor: pointer;
    margin-inline: 0.5rem;
  }

  [part~='area'] {
    block-size: 10rem;
  }

  [part~='hue'],
  [part~='alpha'] {
    block-size: 0.875rem;
    margin-block: 0.5rem;
  }

  [part~='alpha'] {
    background:
      linear-gradient(to right, transparent, var(--color-picker-opaque)),
      var(--checkerboard);
  }

  :host(:dir(rtl)) [part~='alpha'] {
    background:
      linear-gradient(to left, transparent, var(--color-picker-opaque)),
      var(--checkerboard);
  }

  [part~='area-thumb'],
  [part~='hue-thumb'],
  [part~='alpha-thumb'] {
    background-color: var(--color-picker-opaque);
    border: 2px solid var(--paper);
    box-shadow: 0 0 0 2px var(--ink);
    box-sizing: border-box;
  }

  [part~='area-thumb'][part~='focus-visible'],
  [part~='hue-thumb'][part~='focus-visible'],
  [part~='alpha-thumb'][part~='focus-visible'] {
    outline: 3px solid var(--ember);
    outline-offset: 3px;
  }

  [part~='area-thumb'] {
    block-size: 1.25rem;
    inline-size: 1.25rem;
  }

  [part~='hue-thumb'],
  [part~='alpha-thumb'] {
    block-size: 1.875rem;
    inline-size: 1rem;
  }

  [part~='hue-thumb'] {
    background-color: hsl(var(--color-picker-hue) 100% 50%);
  }

  [part~='hex'] {
    background-color: var(--paper);
    block-size: 3rem;
    border: var(--border);
    border-radius: 0;
    box-sizing: border-box;
    color: inherit;
    font-family: var(--font-mono);
    font-size: 1rem;
    padding: 0 0.75rem;

    &:focus-visible {
      box-shadow: 4px 4px 0 var(--ember);
      outline: 2px solid transparent;
    }

    &:disabled {
      background-color: var(--chalk);
      border-style: dashed;
      color: var(--ash);
      cursor: not-allowed;
    }
  }

  [part~='swatches'] {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  [part~='swatch'] {
    background:
      linear-gradient(var(--color-picker-swatch), var(--color-picker-swatch)),
      var(--checkerboard);
    block-size: 2rem;
    border: var(--border);
    box-sizing: border-box;
    cursor: pointer;
    inline-size: 2rem;

    &:focus-visible {
      outline: 3px solid var(--ember);
      outline-offset: 2px;
    }
  }

  [part~='selected'] {
    box-shadow:
      inset 0 0 0 2px var(--paper),
      0 0 0 2px var(--ink);
  }

  [part~='description'] {
    color: var(--ash);
    display: block;
    font-size: 0.875rem;
  }

  :host(:state(disabled)) [part~='container'] {
    cursor: not-allowed;
    opacity: 0.5;
  }

  :host(:state(disabled)) [part~='area'],
  :host(:state(disabled)) [part~='hue'],
  :host(:state(disabled)) [part~='alpha'],
  :host(:state(disabled)) [part~='swatch'] {
    cursor: not-allowed;
  }
`;
