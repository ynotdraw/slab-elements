import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { when } from 'lit/directives/when.js';
import slab from './library/version.js';
import afterReflection from './library/after-reflection.js';
import AriaForwarding from './library/aria-forwarding.js';
import CustomValidity from './library/custom-validity.js';
import customElement from './library/custom-element.js';
import required from './library/required.js';
import styles from './editable.styles.js';
import isComposing from './library/is-composing.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-editable': Editable;
  }
}

/**
 * Text that's edited in place, such as a title or a name: a native button
 * showing the value, that becomes a native input when it's pressed.
 *
 * The button is named by the label and the value, so it reads as "Job name,
 * 14 Alder Lane". Clicking it, or pressing Enter or Space on it, starts
 * editing, with the text selected. Enter commits what's typed and Escape
 * discards it, and both put focus back on the button. Moving focus away
 * commits it too, so a click elsewhere or a Tab doesn't lose it.
 *
 * `value` is what was last committed, and it's what the form gets under
 * `name`. It doesn't change as the input is typed into, only when an edit is
 * committed, which is when "change" is dispatched.
 *
 * It's never invalid on its own. For a rule of your own, such as a name that
 * can't be empty, call `setCustomValidity()` or `setValidity()`, from "change"
 * for one that depends on the value. The validity message shows in its
 * description, as on Text Field, once validity is reported: when focus leaves
 * it, its form is submitted, or `reportValidity()` is called.
 *
 * Style it through its parts and through `:state(disabled)`,
 * `:state(editing)`, `:state(empty)` and `:state(error)`. While it's empty, the button shows
 * `placeholder`.
 *
 * @attr {string} label - Names it. It's the accessible name, and the visible label where there is one.
 * @attr {boolean} [disabled=false] - Disables it, as `disabled` does a native control: the user can't focus or use it, and a form control's value isn't submitted.
 * @attr {boolean} [editing=false] - Whether the input is showing rather than the button. Setting it doesn't move focus. `edit()` does.
 * @attr {boolean} [hide-label=false] - Hides the label visually and leaves it as the accessible name, for a design that shows the label some other way.
 * @attr {number} [maxlength] - The most characters the user can type, as a native input's `maxlength`.
 * @attr {string} [name=''] - The name its value is submitted under, as a native control's `name`.
 * @attr {string} [placeholder] - Shown on the button while it's empty, and in the input.
 * @attr {string} [value=''] - Like a native input, the attribute is the default value and the property is the current one, so the attribute doesn't change as edits are committed.
 *
 * @slot {Element | string} [description] - Text that describes it, such as a hint or what the validity message means. It's its accessible description.
 *
 * @csspart description - Text about the field, and its validity message when it has one
 * @csspart input - The input
 * @csspart label - The label
 * @csspart preview - The button, while not editing
 * @csspart validity-message - The validity message, which says why the value is invalid
 *
 * @cssstate disabled - While it's disabled.
 * @cssstate editing - While it's being edited.
 * @cssstate empty - While it has no value.
 * @cssstate error - While it's invalid and its validity message shows, which is once its validity is reported, as when its form is submitted.
 *
 * @fires {Event} change - When the user changes its value, as a native control's does. Setting it from code doesn't dispatch it.
 * @fires {Event} invalid - When a check finds its value invalid, as a native control's does. Cancel it to leave the validity message unshown.
 *
 * @readonly
 * @prop {HTMLFormElement | null} form - The form it belongs to, or `null`.
 *
 * @readonly
 * @prop {string} validationMessage - What's wrong, as the validity message says it: the message given to `setCustomValidity()` or `setValidity()`. Empty while it's valid.
 *
 * @readonly
 * @prop {ValidityState} validity - Its `ValidityState`, as a native control's.
 *
 * @readonly
 * @prop {boolean} willValidate - Whether its validity is checked when its form submits. It isn't while it's disabled or read-only.
 *
 * @method cancel - Stops editing and discards what's typed.
 *
 * @method checkValidity - Whether its value is valid. Dispatches "invalid" when it isn't, as a native control's does.
 * @returns boolean
 *
 * @method commit - Stops editing and keeps what's typed.
 *
 * @method edit - Starts editing and focuses the input, with its text selected.
 * @returns Promise<void>
 *
 * @method formDisabledCallback - Called by the browser when an ancestor `<fieldset>` is disabled or enabled. Not for calling yourself.
 * @param {boolean} isDisabled
 *
 * @method formResetCallback - Called by the browser when its form resets. Not for calling yourself.
 *
 * @method formStateRestoreCallback - Called by the browser when it restores the value, such as after the back button. Not for calling yourself.
 * @param {string | File | FormData | null} state
 *
 * @method reportValidity - Whether its value is valid. When it isn't, dispatches "invalid" and shows the validity message, as a native control's does.
 * @returns boolean
 *
 * @method resetValidityFeedback - Clears the validity feedback without changing `validity`.
 *
 * @method setCustomValidity - Makes it invalid with a message of your own, or valid again with an empty one, as a native control's does.
 * @param {string} message
 *
 * @method setValidity - Sets its validity and message, as `ElementInternals.setValidity()` does, for checks of your own beyond `setCustomValidity()`.
 * @param {ValidityStateFlags} [flags]
 * @param {string} [message]
 */
@customElement('slab-editable')
export default class Editable extends LitElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ reflect: true })
  @required
  label?: string;

  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * Whether the input is showing rather than the button. Setting it doesn't
   * move focus. `edit()` does.
   */
  @property({ reflect: true, type: Boolean })
  editing = false;

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  @property({ reflect: true, type: Number })
  maxlength?: number;

  @property({ reflect: true, useDefault: true })
  name = '';

  /**
   * Shown on the button while it's empty, and in the input.
   */
  @property({ reflect: true })
  placeholder?: string;

  /**
   * Like a native input, the attribute is the default value and the property
   * is the current one, so the attribute doesn't change as edits are
   * committed.
   */
  @property()
  value = '';

  /** @internal Which version of Slab this is, for debugging. Not public API. */
  @property({ reflect: true })
  readonly version: string = slab.version;

  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  /**
   * What's wrong, as the validity message says it: the message given to
   * `setCustomValidity()` or `setValidity()`. Empty while it's valid.
   */
  get validationMessage(): string {
    return this.#customValidity.validationMessage;
  }

  get validity(): ValidityState {
    return this.#internals.validity;
  }

  get willValidate(): boolean {
    return this.#internals.willValidate;
  }

  /**
   * Stops editing and discards what's typed.
   */
  cancel(): void {
    this.#stopEditing({ isCommit: false });
  }

  checkValidity(): boolean {
    return this.#customValidity.checkValidity();
  }

  /**
   * Stops editing and keeps what's typed.
   */
  commit(): void {
    this.#stopEditing({ isCommit: true });
  }

  /**
   * Starts editing and focuses the input, with its text selected.
   */
  async edit(): Promise<void> {
    if (this.#isDisabled) {
      return;
    }

    this.editing = true;
    await this.updateComplete;

    this.#inputElementRef.value?.focus();
    this.#inputElementRef.value?.select();
  }

  override focus(options?: FocusOptions) {
    (this.#inputElementRef.value ?? this.#previewElementRef.value)?.focus(
      options,
    );
  }

  formDisabledCallback(isDisabled: boolean): void {
    afterReflection(() => {
      this.isFormDisabled = isDisabled;
    });
  }

  formResetCallback(): void {
    this.editing = false;
    this.value = this.getAttribute('value') ?? '';
    this.resetValidityFeedback();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.value = typeof state === 'string' ? state : '';
  }

  override render() {
    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    //
    // The button is named by the label and then by itself, so its value is
    // read after what it's the value of. The label is for whichever is
    // showing, so clicking it clicks the button, or focuses the input.
    return html`<label
        for=${this.editing ? 'input' : 'preview'}
        id="label"
        part="label"
      >
        <!-- The label -->
        ${this.label}
      </label>

      ${
        this.editing
          ? html`<input
              aria-describedby="description"
              aria-invalid=${this.#customValidity.isShowingFeedback ? 'true' : 'false'}
              data-test="input"
              id="input"
              maxlength=${ifDefined(this.maxlength)}
              part="input"
              placeholder=${ifDefined(this.placeholder)}
              type="text"
              @blur=${this.#onInputBlur}
              @input=${this.#onInputInput}
              @keydown=${this.#onInputKeydown}
              ${ref(this.#inputElementRef)}
            />`
          : html`<button
              aria-describedby="description"
              aria-labelledby="label preview"
              data-test="preview"
              id="preview"
              part="preview"
              type="button"
              ?disabled=${this.#isDisabled}
              @blur=${this.#onPreviewBlur}
              @click=${this.#onPreviewClick}
              ${ref(this.#previewElementRef)}
            >
              <!-- The button, while not editing -->
              ${this.value === '' ? this.placeholder : this.value}
            </button>`
      }

      <div id="description" part="description">
        <!-- Text about the field, and its validity message when it has one -->
        <slot name="description">
          <!-- @type {Element | string} -->
        </slot>

        ${when(
          this.#customValidity.isShowingFeedback && this.validationMessage,
          () =>
            html`<span data-test="validity-message" part="validity-message">
              ${this.validationMessage}
            </span>`,
        )}
      </div>`;
  }

  reportValidity(): boolean {
    return this.#customValidity.reportValidity();
  }

  /**
   * Clears the validity feedback without changing `validity`.
   */
  resetValidityFeedback(): void {
    this.#customValidity.resetFeedback();
  }

  setCustomValidity(message: string): void {
    this.#customValidity.setCustomValidity(message);
  }

  setValidity(flags?: ValidityStateFlags, message?: string): void {
    this.#customValidity.setValidity(flags, message);
  }

  // Untyped because `isFormDisabled` is private, and `PropertyValues<this>`
  // only knows public keys.
  override updated(changes: PropertyValues) {
    const input = this.#inputElementRef.value;

    // Only when editing starts, so the input starts from the value but what's
    // typed isn't overwritten by a render that happens while it's typed into.
    if (changes.has('editing') && input) {
      input.value = this.value;
    }

    if (changes.has('disabled') || changes.has('isFormDisabled')) {
      this.#setState('disabled', this.#isDisabled);
    }

    this.#setState('editing', this.editing);
    this.#setState('empty', this.value === '');
    this.#setState('error', this.#customValidity.isShowingFeedback);
    this.#updateFormValue();
  }

  // Untyped for the same reason as `updated()`.
  override willUpdate(changes: PropertyValues) {
    // A field that's disabled while it's being edited stops being edited, and
    // what's typed is discarded, as it would be if focus had been taken away
    // before it could be committed.
    if (
      (changes.has('disabled') || changes.has('isFormDisabled')) &&
      this.#isDisabled
    ) {
      this.editing = false;
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
    this.#internals = this.attachInternals();
  }

  @state()
  private isFormDisabled = false;

  // A consumer's `aria-*`, and Tooltip's, Popover's and Menu's, on the host.
  // It does its work through the host's lifecycle, so nothing calls it.
  // eslint-disable-next-line no-unused-private-class-members
  #ariaForwarding = new AriaForwarding(this, {
    target: () => this.#inputElementRef.value ?? this.#previewElementRef.value,
  });

  #customValidity = new CustomValidity(this, {
    anchor: () => this.#inputElementRef.value ?? this.#previewElementRef.value,
    internals: () => this.#internals,
    isDisabled: () => this.#isDisabled,
  });

  #inputElementRef = createRef<HTMLInputElement>();

  #internals: ElementInternals;

  #previewElementRef = createRef<HTMLButtonElement>();

  get #isDisabled() {
    return this.disabled || this.isFormDisabled;
  }

  // Only when focus leaves the field. Moving from the button to the input is
  // still being in it, as is the button going when editing starts, which some
  // browsers count as a blur.
  #onBlur(event: FocusEvent) {
    const isInside =
      this.editing ||
      (event.relatedTarget instanceof Node &&
        this.renderRoot.contains(event.relatedTarget));

    if (!isInside) {
      this.#customValidity.reportOnBlur();
    }
  }

  #onInputBlur(event: FocusEvent) {
    // Enter and Escape stop editing before the input goes, so there's nothing
    // left to commit when a browser blurs it on the way out. And a browser
    // blurs it when a fieldset around the host is disabled, before
    // `formDisabledCallback()`, which discards what's typed rather than
    // committing it.
    if (this.editing && !this.matches(':disabled')) {
      this.commit();
    }

    this.#onBlur(event);
  }

  // The native input's "input" composes, and would leave the shadow root as
  // the host's even though `value` hasn't changed. It's an edit in progress,
  // so it's kept inside.
  #onInputInput(event: Event) {
    event.stopPropagation();
  }

  async #onInputKeydown(event: KeyboardEvent) {
    // An IME uses Enter and Escape to finish or abandon a composition.
    if (isComposing(event)) {
      return;
    }

    if (event.key === 'Enter' || event.key === 'Escape') {
      // Escape would otherwise also close a dialog the field is in.
      event.preventDefault();
      event.stopPropagation();

      this.#stopEditing({ isCommit: event.key === 'Enter' });

      await this.updateComplete;
      this.#previewElementRef.value?.focus();
    }
  }

  #onPreviewBlur(event: FocusEvent) {
    this.#onBlur(event);
  }

  #onPreviewClick() {
    void this.edit();
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  #stopEditing({ isCommit }: { isCommit: boolean }) {
    if (!this.editing) {
      return;
    }

    this.editing = false;

    // There's no input yet when `editing` was set in the same task, before a
    // render, and so nothing typed to commit.
    const input = this.#inputElementRef.value;

    if (isCommit && input && input.value !== this.value) {
      this.value = input.value;

      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
  }

  #updateFormValue() {
    const isSubmittable = !this.#isDisabled && this.name !== '';
    this.#internals.setFormValue(isSubmittable ? this.value : null);
  }
}
