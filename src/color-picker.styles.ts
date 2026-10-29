import { css } from 'lit';
import visuallyHidden from './library/visually-hidden.js';

export default [
  css`
    /*
      Functional, not visual. A hidden label still names the group and the
      controls, so it's hidden visually rather than removed.
    */
    ${visuallyHidden(":host([hide-label]) [part~='label']")}
  `,
  css`
    /*
      Functional, not visual. Each thumb's range input is what's focused and
      what screenreaders read, while the thumb is what's seen and dragged.
    */
    ${visuallyHidden("input[type='range']")}
  `,
  css`
    /*
      Functional, not visual. The area is the hue from white to fully
      saturated, darkening toward black, the hue slider is the spectrum, and
      the alpha slider is clear to opaque. Without them, there's nothing to
      pick from. Each runs from the inline start, so they're flipped
      right-to-left, as their thumbs are.
    */
    [part~='area'] {
      background:
        linear-gradient(to top, #000, transparent),
        linear-gradient(to right, #fff, hsl(var(--color-picker-hue) 100% 50%));
    }

    [part~='hue'] {
      background: linear-gradient(
        to right,
        #f00,
        #ff0,
        #0f0,
        #0ff,
        #00f,
        #f0f,
        #f00
      );
    }

    [part~='alpha'] {
      background: linear-gradient(
        to right,
        transparent,
        var(--color-picker-opaque)
      );
    }

    :host(:dir(rtl)) [part~='area'] {
      background:
        linear-gradient(to top, #000, transparent),
        linear-gradient(to left, #fff, hsl(var(--color-picker-hue) 100% 50%));
    }

    :host(:dir(rtl)) [part~='hue'] {
      background: linear-gradient(
        to left,
        #f00,
        #ff0,
        #0f0,
        #0ff,
        #00f,
        #f0f,
        #f00
      );
    }

    :host(:dir(rtl)) [part~='alpha'] {
      background: linear-gradient(
        to left,
        transparent,
        var(--color-picker-opaque)
      );
    }

    [part~='swatch'] {
      background-color: var(--color-picker-swatch);
    }
  `,
  css`
    /*
      Functional, not visual. Each thumb is centered on its value, along its
      track and across it, and the area's thumb from the top as well, where
      brightness is highest.
    */
    [part~='area'],
    [part~='hue'],
    [part~='alpha'] {
      position: relative;

      /*
        So a touch drags a thumb rather than scrolling the page.
      */
      touch-action: none;
    }

    [part~='area-thumb'],
    [part~='hue-thumb'],
    [part~='alpha-thumb'] {
      position: absolute;

      /*
        Set on the thumbs as well because they hang over their tracks, and a
        touch on the overhang should drag them too.
      */
      touch-action: none;
      translate: -50% -50%;
    }

    [part~='hue-thumb'],
    [part~='alpha-thumb'] {
      inset-block-start: 50%;
    }

    :host(:dir(rtl)) [part~='area-thumb'],
    :host(:dir(rtl)) [part~='hue-thumb'],
    :host(:dir(rtl)) [part~='alpha-thumb'] {
      translate: 50% -50%;
    }
  `,
];
