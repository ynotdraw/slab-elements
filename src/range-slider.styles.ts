import { css } from 'lit';
import visuallyHidden from './library/visually-hidden.js';

export default [
  css`
    /*
      Functional, not visual. A hidden label still names the group and the
      thumbs, so it's hidden visually rather than removed.
    */
    ${visuallyHidden(":host([hide-label]) [part~='label']")}
  `,
  css`
    /*
      Functional, not visual. The thumbs and the range are placed along the
      track by how far along their values are, which is set as they move. Each
      thumb is centered on its value, along the track and across it.
    */
    [part~='track'] {
      position: relative;

      /*
        So a touch on the track drags a thumb rather than scrolling the page.
      */
      touch-action: none;
    }

    [part~='range'] {
      inset-block: 0;
      position: absolute;
    }

    [part~='start'],
    [part~='end'] {
      inset-block-start: 50%;
      position: absolute;

      /*
        Set on the thumbs as well as the track because they hang over it, and
        a touch on the overhang should drag them too.
      */
      touch-action: none;
      translate: -50% -50%;
    }

    :host(:dir(rtl)) [part~='start'],
    :host(:dir(rtl)) [part~='end'] {
      translate: 50% -50%;
    }
  `,
];
