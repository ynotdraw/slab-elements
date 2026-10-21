import { css } from 'lit';

/*
  The slides sit above the markers and the buttons, which share a row. At
  either end, Previous and Next are "aria-disabled" rather than disabled, so
  they keep focus. They're styled from Carousel's ":state(first)" and
  ":state(last)".
*/
export default css`
  :host {
    color: var(--ink);
    font-family: var(--font-body);
  }

  [part~='carousel'] {
    align-items: center;
    display: grid;
    gap: 0.75rem 1rem;
    grid-template-areas:
      'slides slides'
      'markers controls';
    grid-template-columns: 1fr auto;
  }

  [part~='slides'] {
    background-color: var(--paper);
    border: var(--border);
    box-shadow: var(--shadow);
    grid-area: slides;
    scrollbar-width: none;

    &:focus-visible {
      outline: 3px solid var(--ember);
      outline-offset: 3px;
    }
  }

  ::slotted(*) {
    padding: 1.25rem 1.5rem;
  }

  [part~='controls'] {
    display: flex;
    gap: 0.5rem;
    grid-area: controls;
  }

  [part~='rotation'],
  [part~='previous'],
  [part~='next'] {
    background-color: var(--paper);
    block-size: 2.5rem;
    border: var(--border);
    box-shadow: 3px 3px 0 var(--ink);
    color: var(--ink);
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    padding: 0 0.75rem;
    transition:
      background-color 100ms,
      box-shadow 100ms;

    &:hover {
      background-color: var(--chalk);
    }

    &:active {
      box-shadow: 1px 1px 0 var(--ink);
    }

    &:focus-visible {
      outline: 3px solid var(--ember);
      outline-offset: 3px;
    }
  }

  :host(:state(first)) [part~='previous'],
  :host(:state(last)) [part~='next'] {
    background-color: var(--chalk);
    border-style: dashed;
    box-shadow: none;
    color: var(--ash);
    cursor: not-allowed;
  }

  [part~='markers'] {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    grid-area: markers;
  }

  [part~='marker'] {
    background-color: var(--paper);
    block-size: 0.875rem;
    border: var(--border);
    cursor: pointer;
    inline-size: 0.875rem;
    padding: 0;
    transition: background-color 100ms;

    &:hover {
      background-color: var(--chalk);
    }

    &:focus-visible {
      outline: 3px solid var(--ember);
      outline-offset: 2px;
    }
  }

  [part~='current'] {
    background-color: var(--ember);

    &:hover {
      background-color: var(--ember);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part~='rotation'],
    [part~='previous'],
    [part~='next'],
    [part~='marker'] {
      transition: none;
    }
  }
`;
