import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. The browser's own picker is hidden where it can
      be, so the input doesn't offer two. Chromium's is this indicator, which
      also opens it on a click. Firefox's can't be hidden.
    */
    [part~='input']::-webkit-calendar-picker-indicator {
      display: none;
    }

    /*
      Functional, not visual. A popover in the top layer is centered in the
      viewport by the browser's own styles, nowhere near the field. These put
      the calendar below the input and button and keep it on screen, and
      nothing more: the gap and the look are left to "::part(popover)". The
      anchor name is tree-scoped to this shadow root, so it can't collide with
      another.
    */
    [part~='control'] {
      anchor-name: --control;
    }

    [part~='popover'] {
      inset: auto;
      margin: 0;
      position-anchor: --control;
      position-area: bottom span-right;
      position-try-fallbacks: flip-block;
    }
  `,
];
