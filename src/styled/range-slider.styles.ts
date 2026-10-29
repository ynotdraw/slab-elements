import { css } from 'lit';

/*
  The thumbs are centered on their values, so at either end of the track half
  of one hangs off it. The track is inset by half a thumb so they stay inside
  the host.
*/
export default css`
  :host {
    color: var(--ink);
    display: grid;
    font-family: var(--font-body);
  }

  [part~='container'] {
    display: grid;
    gap: 0.5rem;
  }

  [part~='label'] {
    font-family: var(--font-display);
    font-size: 1.0625rem;
    font-weight: 600;
  }

  [part~='track'] {
    background-color: var(--paper);
    block-size: 0.875rem;
    border: var(--border);
    box-sizing: border-box;
    cursor: pointer;
    margin-block: 0.5rem;
    margin-inline: 0.5rem;
  }

  [part~='range'] {
    background-color: var(--ember);
  }

  [part~='start'],
  [part~='end'] {
    background-color: var(--ink);
    block-size: 1.875rem;
    border: 2px solid var(--paper);
    box-shadow: 0 0 0 2px var(--ink);
    box-sizing: border-box;
    inline-size: 1rem;
  }

  [part~='start'][part~='focus-visible'],
  [part~='end'][part~='focus-visible'] {
    outline: 3px solid var(--ember);
    outline-offset: 3px;
  }

  [part~='description'] {
    color: var(--ash);
    display: block;
    font-size: 0.875rem;
  }

  :host(:state(disabled)) [part~='track'] {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;
