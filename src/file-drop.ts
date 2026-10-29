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
import packageJson from '../package.json' with { type: 'json' };
import AriaForwarding from './library/aria-forwarding.js';
import customElement from './library/custom-element.js';
import isFormCheckingValidity from './library/is-form-checking-validity.js';
import required from './library/required.js';
import styles from './file-drop.styles.js';
import afterReflection from './library/after-reflection.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-file-drop': FileDrop;
  }
}

/**
 * A file input with no visual styles that files can also be dropped onto,
 * around a native `<input type="file">`, so it is picked from, focused, and
 * read the way one is.
 *
 * Files dropped anywhere on the host go into the input's own `files`, the same
 * list the picker fills, so there is one list and one source of truth. A drop
 * dispatches "input" and "change" the way picking does.
 *
 * Validity is the native input's, as with Text Field: `required` is passed
 * through and `valueMissing` is mirrored onto the host.
 *
 * A drop is held to what the picker would allow. Dropped files that don't
 * match `accept` are left out, and without `multiple`, a drop of more than one
 * file is ignored, as a browser ignores it on a native file input.
 *
 * With no files, it submits one empty file under its `name`, as a native file
 * input does.
 *
 * Style it through its parts and through `:state(disabled)`,
 * `:state(drag-over)`, `:state(error)` and `:state(required)`. What the drop
 * target looks like, and how big it is, is left to the styles around it.
 *
 * @attr {string} label
 * @attr {string} [accept] - A hint to the picker. Dropped files aren't filtered by it.
 * @attr {boolean} [disabled=false]
 * @attr {boolean} [hide-label=false]
 * @attr {boolean} [multiple=false] - Without it, only the first of several dropped files is kept.
 * @attr {string} [name='']
 * @attr {boolean} [required=false]
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} [description]
 *
 * @csspart description - Text about the field, and its validity message when it has one
 * @csspart input
 * @csspart label - The label
 * @csspart validity-message
 *
 * @fires {Event} change
 * @fires {Event} input
 *
 * @readonly
 * @prop {FileList | null} files
 *
 * @readonly
 * @prop {HTMLFormElement | null} form
 *
 * @readonly
 * @prop {string} validationMessage - What's wrong, as the validity message says it: the message given to `setCustomValidity()` or `setValidity()`, or else the browser's own. Empty while it's valid.
 *
 * @readonly
 * @prop {ValidityState} validity
 *
 * @readonly
 * @prop {boolean} willValidate
 *
 * @method checkValidity
 * @returns boolean
 *
 * @method formDisabledCallback
 * @param {boolean} isDisabled
 *
 * @method formResetCallback
 *
 * @method formStateRestoreCallback
 * @param {string | File | FormData | null} state
 *
 * @method reportValidity
 * @returns boolean
 *
 * @method resetValidityFeedback - Clears the validity feedback without changing `validity`.
 *
 * @method setCustomValidity
 * @param {string} message
 *
 * @method setValidity
 * @param {ValidityStateFlags} [flags]
 * @param {string} [message]
 */
@customElement('slab-file-drop')
export default class FileDrop extends LitElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ reflect: true })
  @required
  label?: string;

  /**
   * A hint to the picker. Dropped files aren't filtered by it.
   */
  @property({ reflect: true })
  accept?: string;

  @property({ reflect: true, type: Boolean })
  disabled = false;

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  /**
   * Without it, only the first of several dropped files is kept.
   */
  @property({ reflect: true, type: Boolean })
  multiple = false;

  @property({ reflect: true, useDefault: true })
  name = '';

  @property({ reflect: true, type: Boolean })
  required = false;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  // The input's own list rather than a copy, so the picker and a drop can't
  // disagree about what's selected.
  get files(): FileList | null {
    return this.#inputElementRef.value?.files ?? null;
  }

  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  /**
   * What's wrong, as the validity message says it: the message given to
   * `setCustomValidity()` or `setValidity()`, or else the browser's own.
   * Empty while it's valid.
   */
  get validationMessage(): string {
    if (this.validity.valid) {
      return '';
    }

    if (this.validityMessage) {
      return this.validityMessage;
    }

    // The browser's own, or a space where the consumer set a validity without
    // a message.
    return this.#internals.validationMessage.trim();
  }

  get validity(): ValidityState {
    return this.#internals.validity;
  }

  get willValidate(): boolean {
    return this.#internals.willValidate;
  }

  checkValidity(): boolean {
    this.isCheckingValidity = true;
    const isValid = this.#internals.checkValidity();
    this.isCheckingValidity = false;

    return isValid;
  }

  override click() {
    this.#inputElementRef.value?.click();
  }

  override focus(options?: FocusOptions) {
    this.#inputElementRef.value?.focus(options);
  }

  formDisabledCallback(isDisabled: boolean): void {
    afterReflection(() => {
      this.isFormDisabled = isDisabled;
    });
  }

  formResetCallback(): void {
    this.#setFiles([]);
    this.resetValidityFeedback();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    // The empty file submitted when there are none isn't one to restore.
    this.#setFiles(
      state instanceof FormData
        ? state
            .getAll(this.name)
            .filter(
              (entry): entry is File =>
                entry instanceof File && (entry.name !== '' || entry.size > 0),
            )
        : [],
    );
  }

  override render() {
    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    return html`<label for="input" part="label">
        <!-- The label -->
        ${this.label}
      </label>

      <input
        accept=${ifDefined(this.accept)}
        aria-describedby="description"
        aria-invalid=${this.#isShowValidationFeedback ? 'true' : 'false'}
        data-test="input"
        id="input"
        part="input"
        type="file"
        ?disabled=${this.#isDisabled}
        ?multiple=${this.multiple}
        ?required=${this.required}
        @blur=${this.#onInputBlur}
        @change=${this.#onInputChangeOrInput}
        @input=${this.#onInputChangeOrInput}
        ${ref(this.#inputElementRef)}
      />

      <div id="description" part="description">
        <!-- Text about the field, and its validity message when it has one -->
        <slot name="description">
          <!-- @type {Element | string} -->
        </slot>

        ${when(
          this.#isShowValidationFeedback && this.validationMessage,
          () =>
            html`<span data-test="validity-message" part="validity-message">
              ${this.validationMessage}
            </span>`,
        )}
      </div>`;
  }

  reportValidity(): boolean {
    this.hasReportedValidityOrSubmitted = true;

    const isValid = this.#internals.reportValidity();

    // So anything reading `validity.valid` renders again.
    this.requestUpdate();

    return isValid;
  }

  /**
   * Clears the validity feedback without changing `validity`.
   */
  resetValidityFeedback(): void {
    this.hasReportedValidityOrSubmitted = false;
  }

  setCustomValidity(message: string): void {
    this.validityMessage = message;

    if (message === '') {
      this.#hasCustomValidity = false;
      this.#updateValidity();

      return;
    }

    this.#hasCustomValidity = true;

    this.#internals.setValidity(
      { customError: true },
      ' ',
      this.#inputElementRef.value,
    );
  }

  setValidity(flags?: ValidityStateFlags, message?: string): void {
    // From here on the consumer owns validity, so the native input's stops
    // being mirrored onto the host.
    this.#hasCustomValidity = true;
    this.validityMessage = message;

    this.#internals.setValidity(flags, ' ', this.#inputElementRef.value);
  }

  // Untyped because `isFormDisabled` is private, and `PropertyValues<this>`
  // only knows public keys.
  override updated(changes: PropertyValues) {
    if (changes.has('disabled') || changes.has('isFormDisabled')) {
      this.#setState('disabled', this.#isDisabled);
    }

    if (changes.has('isDragOver')) {
      this.#setState('drag-over', this.isDragOver);
    }

    if (changes.has('required')) {
      this.#setState('required', this.required);
    }

    this.#updateFormValue();
    this.#updateValidity();
    this.#setState('error', this.#isShowValidationFeedback);
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

    // On the host rather than the input, so the whole host is the drop target
    // and whatever a consumer slots or styles into it counts too.
    this.addEventListener('dragenter', this.#onDragEnterOrOver);
    this.addEventListener('dragover', this.#onDragEnterOrOver);
    this.addEventListener('dragleave', this.#onDragLeave);
    this.addEventListener('drop', this.#onDrop);

    // On the host because the host is what's form-associated, which is also
    // why a consumer could remove this listener. Nothing better is available.
    this.addEventListener('invalid', (event) => {
      event.preventDefault(); // So no native validation bubble is shown.

      // Focus belongs to the user here unless the form was submitted, or
      // `reportValidity()` was called by something other than a blur.
      if (
        this.isCheckingValidity ||
        this.isBlurring ||
        isFormCheckingValidity(this.form)
      ) {
        return;
      }

      this.hasReportedValidityOrSubmitted = true;

      // The browser ignores this when another control is the first invalid one.
      if (this.form?.querySelector(':invalid') === this) {
        this.focus();
      }
    });
  }

  @state()
  private hasReportedValidityOrSubmitted = false;

  @state()
  private isBlurring = false;

  @state()
  private isCheckingValidity = false;

  @state()
  private isDragOver = false;

  @state()
  private isFormDisabled = false;

  @state()
  private validityMessage?: string;

  // "dragenter" and "dragleave" fire for every element inside the host as the
  // pointer crosses it, so leaving a child isn't leaving the host. Counting
  // them is the only reliable way to tell: `relatedTarget` is null for drags
  // in some browsers.
  // A consumer's `aria-*`, and Tooltip's, Popover's and Menu's, on the host.
  // It does its work through the host's lifecycle, so nothing calls it.
  // eslint-disable-next-line no-unused-private-class-members
  #ariaForwarding = new AriaForwarding(this, {
    target: () => this.#inputElementRef.value,
  });

  #dragDepth = 0;

  #hasCustomValidity = false;

  #inputElementRef = createRef<HTMLInputElement>();

  #internals: ElementInternals;

  get #isDisabled() {
    return this.disabled || this.isFormDisabled;
  }

  get #isShowValidationFeedback() {
    return (
      !this.#isDisabled &&
      !this.validity.valid &&
      this.hasReportedValidityOrSubmitted
    );
  }

  #onDragEnterOrOver = (event: DragEvent) => {
    // Cancelled even when disabled. Otherwise the browser treats a drop here
    // as a drop onto the page and navigates to the file.
    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = this.#isDisabled ? 'none' : 'copy';
    }

    if (event.type === 'dragenter') {
      this.#dragDepth += 1;
    }

    this.isDragOver = !this.#isDisabled;
  };

  // The same matching the picker does: a ".ext" against the name, a "type/*"
  #onDragLeave = () => {
    this.#dragDepth = Math.max(0, this.#dragDepth - 1);

    if (this.#dragDepth === 0) {
      this.isDragOver = false;
    }
  };

  #onDrop = (event: DragEvent) => {
    event.preventDefault();

    this.#dragDepth = 0;
    this.isDragOver = false;

    const files = [...(event.dataTransfer?.files ?? [])].filter((file) =>
      this.#isAccepted(file),
    );

    // A native file input without `multiple` ignores a drop of several files
    // rather than choosing one of them.
    if (
      this.#isDisabled ||
      files.length === 0 ||
      (!this.multiple && files.length > 1)
    ) {
      return;
    }

    this.#setFiles(files);

    // As though the files had been picked.
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  };

  // against the start of the type, and anything else against the whole type.
  #isAccepted(file: File) {
    const tokens = (this.accept ?? '')
      .split(',')
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean);

    if (tokens.length === 0) {
      return true;
    }

    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();

    return tokens.some((token) => {
      if (token.startsWith('.')) {
        return name.endsWith(token);
      }

      if (token.endsWith('/*')) {
        return type.startsWith(token.slice(0, -1));
      }

      return type === token;
    });
  }

  #onInputBlur() {
    this.isBlurring = true;
    this.reportValidity();
    this.isBlurring = false;
  }

  #onInputChangeOrInput(event: Event) {
    // So the form value and validity catch up with the input's new files.
    this.requestUpdate();

    // The analyzer's `add-events` plugin can't see events dispatched by a
    // native control inside a component, and reads their names from the
    // source. So each is dispatched by name from the host instead.
    //
    // "input" composes, so the original is stopped first or it would escape
    // alongside this one. "change" doesn't compose and never leaves the shadow
    // root, so there's nothing to stop.
    if (event.type === 'input') {
      event.stopPropagation();

      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }

    if (event.type === 'change') {
      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
  }

  // An input's `files` can't be written to directly with an array. A
  // `DataTransfer` is the one platform object that builds a `FileList`.
  #setFiles(files: File[]) {
    const input = this.#inputElementRef.value;

    /* v8 ignore next 3 */
    if (!input) {
      return;
    }

    const dataTransfer = new DataTransfer();

    for (const file of files) {
      dataTransfer.items.add(file);
    }

    input.files = dataTransfer.files;
    this.requestUpdate();
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  // One entry per file, the way a native file input submits, and one empty file
  // when there are none.
  #updateFormValue() {
    // Only null before the first render, and this runs after it.
    /* v8 ignore next */
    const files = [...(this.files ?? [])];

    const isSubmittable = !this.#isDisabled && this.name !== '';

    if (!isSubmittable) {
      this.#internals.setFormValue(null);

      return;
    }

    const data = new FormData();

    if (files.length === 0) {
      data.append(
        this.name,
        new File([], '', { type: 'application/octet-stream' }),
      );
    }

    for (const file of files) {
      data.append(this.name, file);
    }

    this.#internals.setFormValue(data);
  }

  // The native input is the one deciding. Reading its `validity` and copying
  // the flags across is all this does.
  #updateValidity() {
    // The consumer owns validity once they've set it themselves.
    if (this.#hasCustomValidity) {
      return;
    }

    const input = this.#inputElementRef.value;

    /* v8 ignore next 3 */
    if (!input) {
      return;
    }

    if (input.validity.valid) {
      this.#internals.setValidity({});

      return;
    }

    this.#internals.setValidity(
      { valueMissing: input.validity.valueMissing },
      // A space when the browser has no message for it, as when it's
      // disabled, since one that's invalid has to have a message.
      input.validationMessage || ' ',
      input,
    );
  }
}
