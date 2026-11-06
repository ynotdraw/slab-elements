import type { CSSResultGroup, CSSResultOrNative } from 'lit';
import Dialog from './dialog.js';
import customElement from './library/custom-element.js';
import styles from './drawer.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-drawer': Drawer;
  }
}

/**
 * A non-modal dialog with no visual styles. It's Dialog, opened with `show()`
 * instead of `showModal()`, so the page behind it stays interactive: there's no
 * focus trap, no `::backdrop`, and nothing is made inert.
 *
 * Everything else is Dialog's: `open`, `returnValue`, `close(returnValue)`, a
 * slotted `<form method="dialog">`, the label, focus moving into it when it
 * opens, and "cancel" and "close" from the host. Focus goes back to where it was
 * when it closes, which the `<dialog>` does itself.
 *
 * A non-modal `<dialog>` ignores Escape unless it has `closedby`, so `closedby`
 * defaults to "closerequest" here. Escape closes it, and "cancel" can still be
 * canceled to keep it open. Set "none" to turn that off, or "any" to also close
 * it on a click outside it.
 *
 * Which edge it's anchored to, and how it gets there, is how it looks. Position
 * it through `::part(dialog)`.
 *
 * @attr {'any'|'closerequest'|'none'} [closedby] - Passed to the `<dialog>`. "any" closes it on a click outside it where the browser supports that. Browsers that don't ignore it.
 * @attr {boolean} [hide-label=false] - Hides the label visually and leaves it as the accessible name, for a design that shows the label some other way.
 * @attr {string} [label] - Names it. It's the accessible name, and the visible label where there is one.
 * @attr {boolean} [open=false] - Whether it's open. Set it to open or close it.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string}
 * @slot {Element | string} [label] - Its heading, in place of `label`
 *
 * @csspart dialog - The native dialog. A modal one's backdrop is its ::backdrop
 * @csspart label - The label
 *
 * @fires {Event} cancel - When the user asks to close it, with Escape or, with `closedby="any"`, a click outside. Cancel it to keep it open, as a native dialog's.
 * @fires {Event} close - When it closes, as a native dialog's does.
 *
 * @prop {string} returnValue - The `<dialog>`'s, so `close(returnValue)` and a `<form method="dialog">` set it the way they do natively.
 *
 * @method close - Closes it, setting `returnValue` to the value given, as a native dialog's `close()` does.
 * @param {string} [returnValue]
 *
 * @method show - Opens it.
 */
@customElement('slab-drawer')
export default class Drawer extends Dialog {
  // `show()` rather than `showModal()`. The rest of the page stays interactive.
  /** @internal For Slab's own subclasses. Not public API. */
  protected override showDialog(dialog: HTMLDialogElement): void {
    dialog.show();
  }

  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  constructor() {
    super();

    // In the constructor rather than as a field, so it's set through Dialog's
    // reactive property instead of shadowing it.
    this.closedby = 'closerequest';
  }
}
