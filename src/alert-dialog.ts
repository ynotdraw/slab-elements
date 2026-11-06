import {
  html,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { property } from 'lit/decorators.js';
import Dialog from './dialog.js';
import customElement from './library/custom-element.js';
import StringsController from './library/strings.js';
import styles from './alert-dialog.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-alert-dialog': AlertDialog;
  }
}

/**
 * A modal dialog with no visual styles that asks for a decision before
 * anything else can happen: "Delete this file?". It's Dialog, with a
 * `[role=alertdialog]` on its `<dialog>`, so screenreaders announce it as
 * urgent, and the description is read along with the label as it opens.
 *
 * It always has a Cancel button, built in, and that's where focus goes when it
 * opens. The APG puts initial focus on the least destructive control, so Enter
 * pressed out of habit doesn't delete anything. An `[autofocus]` element in
 * it wins over the Cancel button, for a dialog that asks for something typed.
 * Cancel closes it with an empty `returnValue`. Slot the action that does what
 * the dialog asks into the default slot, usually as a `<form method="dialog">`
 * button, so its `value` becomes `returnValue` as it does with Dialog.
 *
 * There's no light dismiss. A click outside it does nothing, because an alert
 * dialog wants an answer. `closedby="any"` is treated as "closerequest". Escape
 * still closes it, as Cancel does, and dispatches "cancel", which can be
 * canceled to keep it open. Set `closedby="none"` to turn Escape off where the
 * browser supports it.
 *
 * Everything else is Dialog's: `open`, `returnValue`, `close(returnValue)`,
 * the label, and "cancel" and "close" from the host.
 *
 * @attr {string} [cancel-label] - The Cancel button's text and so its accessible name. "Cancel" in English when unset.
 * @attr {'any'|'closerequest'|'none'} [closedby] - Passed to the `<dialog>`. "none" keeps Escape from closing it where the browser supports that. "any" is treated as "closerequest", since an alert dialog doesn't close on a click outside it.
 * @attr {string} [description] - What the dialog is asking, read with the label when it opens. Plain text. Slot into "description" for more.
 * @attr {boolean} [hide-label=false] - Hides the label visually and leaves it as the accessible name, for a design that shows the label some other way.
 * @attr {string} [label] - Names it. It's the accessible name, and the visible label where there is one.
 * @attr {boolean} [open=false] - Whether it's open. Set it to open or close it.
 *
 * @slot {Element | string} - The action that does what the dialog asks, such as a Delete button in a form with method="dialog".
 * @slot {Element | string} [description] - Text that describes it, such as a hint or what the validity message means. It's its accessible description.
 * @slot {Element | string} [label] - Its heading, in place of `label`
 *
 * @csspart cancel - The Cancel button. Closes the dialog with an empty returnValue
 * @csspart description - The description
 * @csspart dialog - The native dialog. A modal one's backdrop is its ::backdrop
 * @csspart label - The label
 *
 * @cssstate open - While it's open.
 *
 * @fires {Event} cancel - When the user asks to close it, with Escape or, with `closedby="any"`, a click outside. Cancel it to keep it open, as a native dialog's.
 * @fires {Event} close - When it closes, as a native dialog's does.
 * @fires {ToggleEvent} toggle - When it opens or closes, as a `ToggleEvent` with `oldState` and `newState` that doesn't bubble, as a popover's does.
 *
 * @prop {string} returnValue - The `<dialog>`'s, so `close(returnValue)` and a `<form method="dialog">` set it the way they do natively.
 *
 * @method close - Closes it, setting `returnValue` to the value given, as a native dialog's `close()` does.
 * @param {string} [returnValue]
 *
 * @method show - Opens it.
 */
@customElement('slab-alert-dialog')
export default class AlertDialog extends Dialog {
  /**
   * The Cancel button's text and so its accessible name. "Cancel" in English
   * when unset.
   */
  @property({ attribute: 'cancel-label', reflect: true })
  cancelLabel?: string;

  /**
   * Passed to the `<dialog>`. "none" keeps Escape from closing it where the
   * browser supports that. "any" is treated as "closerequest", since an alert
   * dialog doesn't close on a click outside it.
   */
  @property({ reflect: true })
  override closedby?: 'any' | 'closerequest' | 'none';

  /**
   * What the dialog is asking, read with the label when it opens. Plain text.
   * Slot into "description" for more.
   */
  @property({ reflect: true })
  description?: string;

  // The Cancel button, unless something in the dialog is autofocused. Dialog
  // looks for `[autofocus]` the same way.
  /** @internal For Slab's own subclasses. Not public API. */
  protected override focusContent(): void {
    const autofocused = this.querySelector<HTMLElement>('[autofocus]');

    if (autofocused) {
      autofocused.focus();
      return;
    }

    this.#cancelElementRef.value?.focus();
  }

  // The Cancel button comes before the slotted action, so it's first in
  // reading and Tab order, as it is in most platforms' alerts.
  /** @internal For Slab's own subclasses. Not public API. */
  protected override renderContent(): TemplateResult {
    return html`<div id="description" part="description">
        <!-- The description -->
        <slot name="description">
          <!-- @type {Element | string} -->
          ${this.description}
        </slot>
      </div>

      <button
        data-test="cancel"
        part="cancel"
        type="button"
        @click=${this.#onCancelClick}
        ${ref(this.#cancelElementRef)}
      >
        <!-- The Cancel button. Closes the dialog with an empty returnValue -->
        ${this.cancelLabel ?? this.#strings.value.alertDialogCancel}
      </button>

      <slot>
        <!--
          The action that does what the dialog asks, such as a Delete button in a form with method="dialog".
          @type {Element | string}
        -->
      </slot>`;
  }

  // Set here rather than in Dialog's template, which this shares. The role
  // and description only matter to an open dialog, since a closed one isn't
  // rendered.
  /** @internal For Slab's own subclasses. Not public API. */
  protected override showDialog(dialog: HTMLDialogElement): void {
    dialog.setAttribute('role', 'alertdialog');
    dialog.setAttribute('aria-describedby', 'description');
    super.showDialog(dialog);
  }

  // Before Dialog's `updated()` passes `closedby` to the `<dialog>`. Set in
  // `willUpdate()`, so the change doesn't cost another update.
  override willUpdate(changedProperties: PropertyValues<this>) {
    super.willUpdate(changedProperties);

    if (this.closedby === 'any') {
      this.closedby = 'closerequest';
    }
  }

  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  #cancelElementRef = createRef<HTMLButtonElement>();

  #strings = new StringsController(this);

  #onCancelClick = () => {
    this.close('');
  };
}
