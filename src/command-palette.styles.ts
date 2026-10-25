import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. An Option filtered out of the listbox is hidden,
      which has to take it out of the layout and the accessibility tree. Its
      own "display: block" would otherwise win over "[hidden]". The listbox is
      hidden too when nothing matches, in case its own "display" is set.
    */
    ::slotted([hidden]),
    :host(:state(empty)) [part~='listbox'] {
      display: none;
    }
  `,
];
