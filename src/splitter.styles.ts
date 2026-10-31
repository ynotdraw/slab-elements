import { css } from 'lit';
import visuallyHidden from './library/visually-hidden.js';

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
      Safari on iOS needs "touchstart" canceled as well, which Splitter does.
    */
    [part~='separator'] {
      touch-action: none;
    }
  `,
  css`
    /*
      Functional, not visual. The separator's range input is what's focused
      and what screenreaders read, while the separator is what's seen and
      dragged. Positioned in the separator, so focusing it never scrolls to
      somewhere else.
    */
    [part~='separator'] {
      position: relative;
    }

    ${visuallyHidden('input')}
  `,
];
