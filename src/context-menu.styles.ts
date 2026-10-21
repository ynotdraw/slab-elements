import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. The popover is put where the menu was asked for,
      from its inline \`left\` and \`top\`, and nothing more.
    */
    [part~='popover'] {
      inset: auto;
      margin: 0;
      position: fixed;
    }

    /*
      A long-press on a link or an image in the target would otherwise open
      iOS's own callout over the menu.
    */
    ::slotted([slot='target']) {
      -webkit-touch-callout: none;
    }
  `,
];
