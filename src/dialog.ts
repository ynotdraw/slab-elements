import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type TemplateResult,
} from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { property } from 'lit/decorators.js';
import slab from './library/version.js';
import customElement from './library/custom-element.js';
import ToggleEvents from './library/toggle-events.js';
import styles from './dialog.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-dialog': Dialog;
  }
}

/**
 * A dialog with no visual styles, around a native `<dialog>`, opened modally or
 * not the way one is.
 *
 * `showModal()` opens it as a modal: it traps focus, closes on Escape, has a
 * `::backdrop`, and makes the rest of the page inert. `show()`, or setting
 * `open`, opens it non-modally, as they open a `<dialog>`: the rest of the page
 * stays interactive, there's no backdrop, and, as natively, Escape only closes
 * it with `closedby`. Calling either method while it's open leaves it as it
 * is. Match a modal one with `::part(dialog):modal`.
 *
 * `modal` is Slab's, for a modal opened declaratively, as a framework binding
 * `open` does: with it, setting `open` opens it as `showModal()` does.
 *
 * `open` reflects, and it stays true to the dialog: when the dialog closes
 * itself, on Escape or through a `<form method="dialog">`, `open` goes false
 * along with it. `close(returnValue)` and a `<form method="dialog">`'s
 * submitter both set `returnValue`, as they do on a `<dialog>`.
 *
 * The dialog is named by its label: the `label` attribute or the `label` slot.
 * The label isn't a heading, because a heading's level is the page's to
 * choose. Plain `label` text names the dialog without being one. For a heading,
 * slot your own at whatever level fits: `<h2 slot="label">`.
 *
 * Light dismiss is the platform's or nothing. `closedby="any"` is passed
 * through to the `<dialog>`, which closes on a backdrop click where the browser
 * supports it and ignores the attribute where it doesn't. Nothing here listens
 * for clicks on the backdrop to fake it.
 *
 * Style it through its parts, and the backdrop through
 * `::part(dialog)::backdrop`.
 *
 * @attr {'any'|'closerequest'|'none'} [closedby] - Passed to the `<dialog>`. "any" closes it on a click outside it where the browser supports that. Browsers that don't ignore it.
 * @attr {boolean} [hide-label=false] - Hides the label visually and leaves it as the accessible name, for a design that shows the label some other way.
 * @attr {string} [label] - Names it. It's the accessible name, and the visible label where there is one.
 * @attr {boolean} [modal=false] - Opens it as a modal when `open` is set, as `showModal()` does, for a modal opened declaratively. Not on a native `<dialog>`, where `open` always opens a non-modal one. `show()` and `showModal()` open it as they say whatever it is, and a change while it's open waits for it to open again.
 * @attr {boolean} [open=false] - Whether it's open. Setting it opens it non-modally, as `open` does on a `<dialog>`, unless `modal` is set.
 *
 * @slot {Element | string}
 * @slot {Element | string} [label] - Its heading, in place of `label`
 *
 * @csspart dialog - The native dialog. A modal one's backdrop is its ::backdrop
 * @csspart label - The label
 *
 * @cssstate open - While it's open.
 *
 * @fires {Event} cancel - When something asks it to close: Escape, a click outside with `closedby="any"`, or `requestClose()`. Cancel it to keep it open, as a native dialog's.
 * @fires {Event} close - When it closes, as a native dialog's does.
 * @fires {ToggleEvent} toggle - When it opens or closes, as a `ToggleEvent` with `oldState` and `newState` that doesn't bubble, as a popover's does.
 *
 * @prop {string} returnValue - The `<dialog>`'s, so `close(returnValue)` and a `<form method="dialog">` set it the way they do natively.
 *
 * @method close - Closes it, setting `returnValue` to the value given, as a native dialog's `close()` does.
 * @param {string} [returnValue]
 *
 * @method requestClose - Asks it to close, as a native dialog's `requestClose()` does: "cancel" first, then a close that sets `returnValue` to the value given, unless "cancel" is canceled.
 * @param {string} [returnValue]
 *
 * @method show - Opens it non-modally, as a native dialog's `show()` does, whether or not `modal` is set. The rest of the page stays interactive.
 * @method showModal - Opens it as a modal, as a native dialog's `showModal()` does, whether or not `modal` is set.
 */
@customElement('slab-dialog')
export default class Dialog extends LitElement {
  /**
   * Passed to the `<dialog>`. "any" closes it on a click outside it where the
   * browser supports that. Browsers that don't ignore it.
   */
  @property({ reflect: true })
  closedby?: 'any' | 'closerequest' | 'none';

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  @property({ reflect: true })
  label?: string;

  /**
   * Opens it as a modal when `open` is set, as `showModal()` does, for a modal
   * opened declaratively. Not on a native `<dialog>`, where `open` always opens
   * a non-modal one. `show()` and `showModal()` open it as they say whatever
   * it is, and a change while it's open waits for it to open again.
   */
  @property({ reflect: true, type: Boolean })
  modal = false;

  @property({ reflect: true, type: Boolean })
  open = false;

  /** @internal Which version of Slab this is, for debugging. Not public API. */
  @property({ reflect: true })
  readonly version: string = slab.version;

  // Command Palette sets its own states on it, and an element's internals can
  // only be attached once.
  /** @internal For Slab's own subclasses. Not public API. */
  protected get internals(): ElementInternals {
    return this.#internals;
  }

  /**
   * The `<dialog>`'s, so `close(returnValue)` and a `<form method="dialog">`
   * set it the way they do natively.
   *
   * @default ''
   */
  get returnValue(): string {
    return this.#dialogElementRef.value?.returnValue ?? this.#returnValue;
  }

  set returnValue(value: string) {
    this.#returnValue = value;

    if (this.#dialogElementRef.value) {
      this.#dialogElementRef.value.returnValue = value;
    }
  }

  close(returnValue?: string): void {
    // Straight to the `<dialog>`, so `returnValue` is set and "close" is
    // dispatched the way they would be natively. `open` follows from "close".
    this.#dialogElementRef.value?.close(returnValue);
  }

  override firstUpdated() {
    const dialog = this.#dialogElementRef.value;

    /* v8 ignore next 3 */
    if (!dialog) {
      return;
    }

    dialog.returnValue = this.#returnValue;
  }

  // Chrome looks for something to focus in the dialog's flat tree when it's
  // opened, so it finds slotted content. Firefox and Safari only look in the
  // dialog's own tree, where nothing is focusable, and leave focus on the
  // dialog. So this does what Chrome does, in every browser: focus what's
  // autofocused, or else the first thing that takes focus.
  //
  // Trying `focus()` on each element and seeing whether it stuck, rather than
  // matching a list of focusable selectors, leaves what's focusable to the
  // browser. Elements that aren't assigned to a slot aren't rendered, so they
  // don't take focus and are passed over.
  //
  // Command Palette overrides it to focus its input, which is in the shadow
  // root rather than slotted.
  /** @internal For Slab's own subclasses. Not public API. */
  protected focusContent(): void {
    const elements = [
      ...this.querySelectorAll<HTMLElement>('[autofocus]'),
      ...this.querySelectorAll<HTMLElement>('*'),
    ];

    for (const element of elements) {
      element.focus();

      if (this.querySelector(':focus')) {
        return;
      }
    }
  }

  override render() {
    return html`<dialog
      aria-labelledby="label"
      data-test="dialog"
      part="dialog"
      @cancel=${this.#onDialogCancel}
      @close=${this.#onDialogClose}
      ${ref(this.#dialogElementRef)}
    >
      <!-- The native dialog. A modal one's backdrop is its ::backdrop -->
      <div id="label" part="label">
        <!-- The label -->
        <slot name="label">
          <!-- @type {Element | string} -->
          ${this.label}
        </slot>
      </div>

      ${this.renderContent()}
    </dialog>`;
  }

  // What's in the `<dialog>` below the label. Command Palette overrides it to
  // put its input and listbox there, and inherits everything else.
  /** @internal For Slab's own subclasses. Not public API. */
  protected renderContent(): TemplateResult {
    return html`<slot>
      <!-- @type {Element | string} -->
    </slot>`;
  }

  // Not left to the `<dialog>`'s own `requestClose()`, which Slab's browser
  // minimums predate. It does what that does: a cancelable "cancel", then a
  // close with `returnValue` unless "cancel" was canceled.
  requestClose(returnValue?: string): void {
    if (!this.#dialogElementRef.value?.open) {
      return;
    }

    const isAllowed = this.dispatchEvent(
      new Event('cancel', { cancelable: true }),
    );

    if (isAllowed) {
      this.close(returnValue);
    }
  }

  show(): void {
    this.#open({ isModal: false });
  }

  // How the `<dialog>` is opened: as `show()` or `showModal()` asked, or, when
  // `open` was set, as a modal only with `modal`. Alert Dialog overrides it to
  // set its role.
  /** @internal For Slab's own subclasses. Not public API. */
  protected showDialog(dialog: HTMLDialogElement): void {
    if (this.#isModal ?? this.modal) {
      dialog.showModal();
    } else {
      dialog.show();
    }
  }

  showModal(): void {
    this.#open({ isModal: true });
  }

  override updated() {
    const dialog = this.#dialogElementRef.value;

    /* v8 ignore next 3 */
    if (!dialog) {
      return;
    }

    // Set here rather than in the template because lit-analyzer doesn't know
    // the attribute yet.
    if (this.closedby) {
      dialog.setAttribute('closedby', this.closedby);
    } else {
      dialog.removeAttribute('closedby');
    }

    // Guarded both ways because "close" sets `open` too. By the time that
    // update runs, the dialog is already closed.
    if (this.open && !dialog.open) {
      this.showDialog(dialog);
      this.focusContent();
    } else if (!this.open && dialog.open) {
      dialog.close();
    }

    if (this.open) {
      this.#internals.states.add('open');
    } else {
      this.#internals.states.delete('open');
    }

    // After the `<dialog>` has opened or closed, so a listener finds it as
    // "toggle" says.
    const toggle = this.#toggleEvents.update(this.open);

    if (toggle) {
      this.dispatchEvent(new ToggleEvent('toggle', toggle));
    }
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  constructor() {
    super();

    // On the host because the form is slotted, so it's a descendant of the host
    // rather than of the `<dialog>`, and a native `<form method="dialog">` only
    // closes a dialog it's a descendant of. "submit" doesn't compose, but it
    // does bubble to the host from the host's own children.
    this.addEventListener('submit', this.#onSubmit);

    this.#internals = this.attachInternals();
  }

  #dialogElementRef = createRef<HTMLDialogElement>();

  #internals: ElementInternals;

  // Whether `show()` or `showModal()` opened it, until it closes. Unset when
  // `open` opened it, which goes by `modal`.
  #isModal: boolean | undefined;

  // For a `returnValue` set before the `<dialog>` is rendered.
  #returnValue = '';

  #toggleEvents = new ToggleEvents();

  // What a `<form method="dialog">` does natively: close the dialog, with the
  // submitter's value as its `returnValue`.
  #onSubmit = (event: SubmitEvent) => {
    const form = event.target;
    const submitter = event.submitter;

    /* v8 ignore next 3 */
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    // A submitter's `formmethod` wins over its form's `method`, as it does
    // natively.
    const method =
      (submitter instanceof HTMLButtonElement ||
        submitter instanceof HTMLInputElement) &&
      submitter.hasAttribute('formmethod')
        ? submitter.formMethod
        : form.method;

    // A form inside a `<dialog>` of the consumer's own closes that one
    // natively.
    const nearestDialog = form.closest('dialog');
    const isInNestedDialog = nearestDialog && this.contains(nearestDialog);

    if (event.defaultPrevented || method !== 'dialog' || isInNestedDialog) {
      return;
    }

    // A submitter without a value leaves `returnValue` alone, as it does
    // natively.
    this.close(submitter?.getAttribute('value') ?? undefined);
  };

  // Neither event leaves the shadow root: "cancel" and "close" don't bubble or
  // compose. So each is dispatched again from the host, not composed, the way a
  // `<dialog>` dispatches them. "cancel" stays cancelable, and cancelling the
  // host's cancels the dialog's, so the platform's way of keeping a dialog open
  // on Escape still works.
  #onDialogCancel(event: Event) {
    const isAllowed = this.dispatchEvent(
      new Event('cancel', { cancelable: true }),
    );

    if (!isAllowed) {
      event.preventDefault();
    }
  }

  #onDialogClose() {
    this.#isModal = undefined;
    this.open = false;
    this.dispatchEvent(new Event('close'));
  }

  // Opening while it's open leaves it as it is, rather than throwing when the
  // other method opened it, as a `<dialog>` does. Slab's elements don't throw
  // for being opened twice.
  #open({ isModal }: { isModal: boolean }) {
    if (this.open) {
      return;
    }

    this.#isModal = isModal;
    this.open = true;
  }
}
