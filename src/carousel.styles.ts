import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A custom element is inline by default, and the
      carousel lays out its slides: one after another, each as wide as the
      carousel, in a scroll snap container. So swiping, scrolling and the
      arrow keys move between them, and land each one in place, in every
      browser without a script.
    */
    :host {
      display: block;
    }

    [part~='slides'] {
      display: grid;
      grid-auto-columns: 100%;
      grid-auto-flow: column;
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scroll-snap-type: x mandatory;
    }

    /*
      Previous, Next and the markers scroll smoothly unless the user prefers
      reduced motion.
    */
    @media (prefers-reduced-motion: no-preference) {
      [part~='slides'] {
        scroll-behavior: smooth;
      }
    }

    /*
      "always", so a swipe moves one slide rather than flinging past several.
    */
    ::slotted(*) {
      scroll-snap-align: start;
      scroll-snap-stop: always;
    }
  `,
];
