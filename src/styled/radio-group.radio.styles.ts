import { css } from 'lit';

export default css`
  :host {
    align-items: start;
    background-color: var(--paper);
    border: var(--border);
    cursor: pointer;
    display: grid;
    gap: 0.75rem;
    grid-template-columns: auto 1fr;
    padding: 0.875rem 1rem;
    transition:
      border-color 100ms,
      box-shadow 100ms,
      translate 100ms;
  }

  :host(:hover) {
    background-color: var(--chalk);
  }

  :host(:focus-visible) {
    outline: 3px solid var(--ember);
    outline-offset: 2px;
  }

  :host(:state(checked)) {
    background-color: var(--paper);
    border-color: var(--ember);
    box-shadow: var(--shadow);
    translate: -2px -2px;
  }

  :host(:state(disabled)) {
    border-style: dashed;
    box-shadow: none;
    color: var(--ash);
    cursor: not-allowed;
    translate: none;
  }

  /* The mark. Checked, an ember dot sits inside a ring of paper. */
  :host::before {
    background-color: var(--paper);
    block-size: 1.125rem;
    border: var(--border);
    border-radius: 50%;
    box-sizing: border-box;
    content: '';
    inline-size: 1.125rem;
    margin-block-start: 0.125rem;
  }

  :host(:state(checked))::before {
    background: radial-gradient(
      circle,
      var(--ember) 0 0.25rem,
      var(--paper) 0.3rem
    );
    border-color: var(--ember);
  }

  /*
    Forced colors drop gradients, and the dot is one. Its colors are system
    colors there, so it can keep them.
  */
  @media (forced-colors: active) {
    :host::before {
      forced-color-adjust: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :host {
      transition: none;
    }
  }
`;
