import { css } from 'lit';

export default [
  css`
    /*
      Functional, not visual. An Option Group is a block of rows, as each
      Option is.
    */
    :host {
      display: block;
    }

    /*
      Functional, not visual. Combobox hides an Option Group with \`hidden\`
      once it's filtered out every Option in it, and important for the same
      reason Option's is: a \`display\` from a subclass or a page would win.
    */
    :host([hidden]) {
      display: none !important;
    }

    :host([hide-label]) [part~='label'] {
      display: none;
    }

    /*
      Functional, not visual. A Listbox or Combobox with "virtual" lays out only
      the Option Groups with Options in or near view, and important for the
      same reason.
    */
    :host(:state(private-unrendered)) {
      display: none !important;
    }
  `,
  css`
    /*
      Functional, not visual. A group whose only Option left in the
      accessibility tree is the active one, scrolled out of view. Important
      for the same reason as Option's.
    */
    :host(:state(private-offscreen)) {
      block-size: 1px !important;
      border-width: 0 !important;
      clip-path: inset(50%) !important;
      inline-size: 1px !important;
      margin: -1px !important;
      overflow: hidden !important;
      padding: 0 !important;
      position: absolute !important;
      white-space: nowrap !important;
    }
  `,
];
