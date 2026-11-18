import { css } from 'lit';

/*
  Dialog's styles, then these, which move it to the page's end edge at full
  height. A non-modal one has no backdrop, so the shadow falls across the page
  instead. A modal one, opened with showModal(), keeps Dialog's backdrop.
*/
export default css`
  [part~='dialog'] {
    animation: slide 200ms ease-out;
    block-size: 100dvh;
    border-block: 0;
    border-inline-end: 0;
    box-shadow: -8px 0 0 var(--ember);
    inline-size: min(26rem, 100% - 2rem);
    inset-block: 0;
    inset-inline: auto 0;
    margin: 0;
    max-block-size: none;
    position: fixed;
  }

  @keyframes slide {
    from {
      opacity: 0;
      translate: 1.5rem 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part~='dialog'] {
      animation: none;
    }
  }
`;
