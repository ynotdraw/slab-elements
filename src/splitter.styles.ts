import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. A custom element is inline by default, and the
      splitter lays out its panes. The grid's tracks are set as the separator
      moves.
    */
    :host {
      display: block;
    }

    [part~='container'] {
      block-size: 100%;
      display: grid;
    }

    /*
      A pane made smaller than its content scrolls, rather than spilling over
      the separator and the other pane.
    */
    [part~='primary'],
    [part~='secondary'] {
      overflow: auto;
    }

    /*
      So a touch on the separator drags it rather than scrolling the page.
    */
    [part~='separator'] {
      touch-action: none;
    }
  `,
];
