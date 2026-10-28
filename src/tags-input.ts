import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
} from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { when } from 'lit/directives/when.js';
import packageJson from '../package.json' with { type: 'json' };
import AriaForwarding from './library/aria-forwarding.js';
import customElement from './library/custom-element.js';
import afterReflection from './library/after-reflection.js';
import isFormCheckingValidity from './library/is-form-checking-validity.js';
import required from './library/required.js';
import TagsController from './library/tags-controller.js';
import styles from './tags-input.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-tags-input': TagsInput;
  }
}

/**
 * A text input that turns what's typed into tags, with no visual styles. It's
 * for values with no list to pick from, such as keywords or email addresses.
 * When there is a list, use Combobox with `multiple`, whose tags work the same
 * way.
 *
 * Enter adds what's typed as a tag, and so does typing `delimiter`, a comma
 * unless it's changed, so "red, green, blue" pasted in is three tags. What's
 * typed is trimmed, and text that's empty, or a tag already there, adds
 * nothing. With `max`, no more are added once there are that many, and what
 * didn't fit is left in the input. When focus leaves, what's typed is added
 * too, so it isn't lost on a submit.
 *
 * Each tag is a `<button>` before the input that removes it. Backspace in an
 * empty input removes the last, and Left at the start of the input moves focus
 * to the tags, where Left and Right move between them and Backspace, Delete,
 * Enter and Space remove one. They aren't Tab stops, so Tab still leaves in one
 * press. Enter in an empty input submits the form, as it does in a native one.
 *
 * `values` lists the tags in the order they were added, and each is submitted
 * as its own entry, the way a `<select multiple>` submits them. The `value`
 * attribute is the initial tags separated by commas, as on an
 * `<input type="email" multiple>`, and the `value` property is the current
 * ones, joined by commas. "input" and "change" are dispatched together when a
 * tag is added or removed, rather than on every keystroke.
 *
 * Style it through its parts and through `:state(disabled)`, `:state(empty)`
 * when it has no tags, `:state(error)`, `:state(full)` when it has `max` tags,
 * and `:state(required)`.
 *
 * @attr {string} label
 * @attr {string} [delimiter=','] - Typed or pasted, adds what's before it as a tag. Only Enter does when it's empty.
 * @attr {boolean} [disabled=false]
 * @attr {boolean} [hide-label=false]
 * @attr {number} [max] - The most tags the user can add. A `values` set with more keeps them all.
 * @attr {string} [name='']
 * @attr {string} [placeholder]
 * @attr {boolean} [required=false]
 * @attr {string} [value=''] - The tags, separated by commas, each trimmed. Like a native input, the attribute is the default value and the property is the current one. Use `values` for tags with commas in them.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} [description]
 *
 * @csspart description - Text about the input, and its validity message when it has one
 * @csspart input
 * @csspart label - The label
 * @csspart tag - A tag's button, which removes it
 * @csspart tags - The tags
 * @csspart validity-message
 *
 * @fires {Event} change
 * @fires {Event} input
 *
 * @readonly
 * @prop {HTMLFormElement | null} form
 *
 * @prop {(text: string) => string} removeLabel - Names each tag's button, which shows only the tag, from the tag. "Remove" and the tag when unset.
 *
 * @readonly
 * @prop {ValidityState} validity
 *
 * @prop {string[]} values - Every tag, in the order they were added.
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
@customElement('slab-tags-input')
export default class TagsInput extends LitElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ reflect: true })
  @required
  label?: string;

  /**
   * Typed or pasted, adds what's before it as a tag. Only Enter does when
   * it's empty.
   */
  @property({ reflect: true, useDefault: true })
  delimiter = ',';

  @property({ reflect: true, type: Boolean })
  disabled = false;

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  /**
   * The most tags the user can add. A `values` set with more keeps them all.
   */
  @property({ reflect: true, type: Number })
  max?: number;

  @property({ reflect: true, useDefault: true })
  name = '';

  @property({ reflect: true })
  placeholder?: string;

  /**
   * Names each tag's button, which shows only the tag, from the tag. "Remove"
   * and the tag when unset.
   */
  @property({ attribute: false })
  removeLabel: (text: string) => string = (text) => `Remove ${text}`;

  @property({ reflect: true, type: Boolean })
  required = false;

  /**
   * The tags, separated by commas, each trimmed. Like a native input, the
   * attribute is the default value and the property is the current one. Use
   * `values` for tags with commas in them.
   *
   * @default ''
   */
  @property()
  get value(): string {
    return this.values.join(',');
  }

  set value(value: string) {
    this.values = split(value, ',');
  }

  /**
   * Every tag, in the order they were added.
   *
   * @default []
   */
  @property({ attribute: false })
  get values(): string[] {
    return this.#values;
  }

  set values(values: string[]) {
    const old = this.#values;
    this.#values = values;
    this.requestUpdate('values', old);
  }

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  get validity(): ValidityState {
    return this.#internals.validity;
  }

  checkValidity(): boolean {
    // So the "invalid" handler knows not to take focus. `checkValidity()`
    // reports nothing to the user, so nothing should move.
    this.isCheckingValidity = true;
    const isValid = this.#internals.checkValidity();
    this.isCheckingValidity = false;

    return isValid;
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
    this.value = this.getAttribute('value') ?? '';
    this.#clearText();
    this.resetValidityFeedback();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.values =
      state instanceof FormData
        ? state
            .getAll(this.name)
            .filter((value): value is string => typeof value === 'string')
        : [];
  }

  override render() {
    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    return html`<label for="input" id="label" part="label">
        <!-- The label -->
        ${this.label}
      </label>

      ${this.#renderTags()}

      <input
        aria-describedby="values description"
        aria-invalid=${this.#isShowValidationFeedback ? 'true' : 'false'}
        aria-required=${this.required ? 'true' : 'false'}
        autocomplete="off"
        data-test="input"
        id="input"
        part="input"
        placeholder=${ifDefined(this.placeholder)}
        type="text"
        ?disabled=${this.#isDisabled}
        @blur=${this.#onInputBlur}
        @change=${this.#onInputChange}
        @input=${this.#onInputInput}
        @keydown=${this.#onInputKeydown}
        ${ref(this.#inputElementRef)}
      />

      <div id="description" part="description">
        <!-- Text about the input, and its validity message when it has one -->
        <slot name="description">
          <!-- @type {Element | string} -->
        </slot>

        ${when(
          this.#isShowValidationFeedback && this.validityMessage,
          () =>
            html`<span data-test="validity-message" part="validity-message">
              ${this.validityMessage}
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
      this.#internals.setValidity({ customError: false }, '', this.#anchor);

      return;
    }

    this.#internals.setValidity(
      {
        customError: true,
        valueMissing: this.#internals.validity.valueMissing,
      },
      ' ',
      this.#anchor,
    );
  }

  setValidity(flags?: ValidityStateFlags, message?: string): void {
    // From here on the consumer owns validity, so `required` stops setting it.
    this.#hasCustomValidity = true;
    this.validityMessage = message;

    this.#internals.setValidity(flags, ' ', this.#anchor);
  }

  override updated() {
    this.#setState('disabled', this.#isDisabled);
    this.#setState('empty', this.values.length === 0);
    this.#setState('full', this.#isFull);
    this.#setState('required', this.required);
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
  private isFormDisabled = false;

  @state()
  private validityMessage?: string;

  // A consumer's `aria-*`, and Tooltip's, Popover's and Menu's, on the host.
  // It does its work through the host's lifecycle, so nothing calls it.
  // eslint-disable-next-line no-unused-private-class-members
  #ariaForwarding = new AriaForwarding(this, {
    target: () => this.#inputElementRef.value,
  });

  #hasCustomValidity = false;

  #inputElementRef = createRef<HTMLInputElement>();

  #internals: ElementInternals;

  #tags = new TagsController(this, {
    input: () => this.#inputElementRef.value,
    isDisabled: () => this.#isDisabled,
    label: (text) => this.removeLabel(text),
    onBlur: (event) => {
      this.#onBlur(event);
    },
    onRemove: (index) => {
      this.#remove(index);
    },
  });

  #values: string[] = [];

  // What a validation message is anchored to, so reporting validity takes
  // focus somewhere sensible.
  get #anchor() {
    return this.#inputElementRef.value;
  }

  get #isDisabled() {
    return this.disabled || this.isFormDisabled;
  }

  get #isFull() {
    return this.max !== undefined && this.values.length >= this.max;
  }

  get #isShowValidationFeedback() {
    return (
      !this.#isDisabled &&
      !this.validity.valid &&
      this.hasReportedValidityOrSubmitted
    );
  }

  // What's in the input, which is only read once there's an input to read.
  get #text() {
    /* v8 ignore next */
    return this.#inputElementRef.value?.value ?? '';
  }

  set #text(text: string) {
    const input = this.#inputElementRef.value;

    /* v8 ignore next 3 */
    if (!input) {
      return;
    }

    input.value = text;
  }

  #onInputBlur = (event: FocusEvent) => {
    this.#onBlur(event);
  };

  // "change" doesn't compose and never leaves the shadow root, but it's
  // stopped anyway so it's plain that the host's own is the only one.
  #onInputChange = (event: Event) => {
    event.stopPropagation();
  };

  #onInputInput = (event: Event) => {
    // "input" composes, so it's stopped or it would escape the shadow root.
    // The host's own is dispatched when a tag is added or removed, not on
    // every keystroke.
    event.stopPropagation();

    if (this.delimiter === '' || !this.#text.includes(this.delimiter)) {
      return;
    }

    // What's after the last delimiter is still being typed, so it's left in
    // the input rather than added.
    const pieces = this.#text.split(this.delimiter);
    const typing = pieces.pop();

    this.#add(pieces.join(this.delimiter), typing);
  };

  #onInputKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      // A native input submits its form on Enter. This one's in the shadow
      // root, so it has no form, and the host's is submitted for it. Not
      // while there's something to add, so a form isn't submitted part-way
      // through.
      if (this.#text.trim() === '') {
        this.form?.requestSubmit();

        return;
      }

      event.preventDefault();
      this.#add(this.#text);

      return;
    }

    // Left alone when there's nothing to clear, so a Dialog or Drawer around
    // it still closes.
    if (event.key === 'Escape' && this.#text !== '') {
      event.preventDefault();
      this.#clearText();

      return;
    }

    if (event.key === 'Backspace' && this.#text === '') {
      if (this.values.length > 0) {
        event.preventDefault();
        this.#remove(this.values.length - 1);
      }

      return;
    }

    const input = this.#inputElementRef.value;
    const isAtStart = input?.selectionStart === 0 && input.selectionEnd === 0;

    if (event.key === 'ArrowLeft' && isAtStart && this.#tags.focusLast()) {
      event.preventDefault();
    }
  };

  // Adds each tag in `text` that's new and fits, and leaves in the input what
  // didn't fit, followed by what's still being typed.
  #add(text: string, typing?: string) {
    const values = [...this.values];
    const unadded: string[] = [];

    for (const tag of split(text, this.delimiter)) {
      if (values.includes(tag)) {
        continue;
      }

      if (this.max !== undefined && values.length >= this.max) {
        unadded.push(tag);
      } else {
        values.push(tag);
      }
    }

    this.#text = [...unadded, ...(typing === undefined ? [] : [typing])].join(
      this.delimiter,
    );

    this.#setValues(values);
  }

  #clearText() {
    this.#text = '';
  }

  // Only when focus leaves the input and its tags. Moving between them is
  // still being in it, and leaves what's typed where it is.
  #onBlur(event: FocusEvent) {
    const isInside =
      event.relatedTarget instanceof Node &&
      this.renderRoot.contains(event.relatedTarget);

    if (isInside) {
      return;
    }

    // So what's typed isn't lost when the form is submitted by a click.
    this.#add(this.#text);

    this.isBlurring = true;
    this.reportValidity();
    this.isBlurring = false;
  }

  #remove(index: number) {
    this.#setValues(this.values.filter((_, other) => other !== index));
  }

  #renderTags() {
    // The input is described by the tags' text rather than by the tags, whose
    // names each start with "Remove". A `hidden` element can still describe
    // one.
    return html`<span hidden id="values">${this.values.join(', ')}</span>

      <div part="tags">
        <!--
          The tags
          @part tag - A tag's button, which removes it
        -->
        ${this.#tags.render(this.values.map((value) => ({ text: value, value })))}
      </div>`;
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  // Tags the user added or removed, with the events a native control
  // dispatches.
  #setValues(values: string[]) {
    if (values.length === this.values.length) {
      return;
    }

    this.values = values;

    // Now rather than on the next render, so a form submitted straight after,
    // by Enter, sees it.
    this.#updateFormValue();
    this.#updateValidity();

    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  #updateFormValue() {
    if (this.#isDisabled || this.name === '') {
      this.#internals.setFormValue(null);

      return;
    }

    // One entry per tag, the way a native `<select multiple>` submits.
    const data = new FormData();

    for (const value of this.values) {
      data.append(this.name, value);
    }

    this.#internals.setFormValue(data);
  }

  #updateValidity() {
    // The consumer owns validity once they've set it themselves.
    if (this.#hasCustomValidity) {
      return;
    }

    const customError = Boolean(this.validityMessage);
    const valueMissing = this.required && this.values.length === 0;

    // A message from `setCustomValidity()` is kept until it's cleared, however
    // the tags change.
    if (customError || valueMissing) {
      this.#internals.setValidity(
        { customError, valueMissing },
        ' ',
        this.#anchor,
      );

      return;
    }

    this.#internals.setValidity({});
  }
}

// Each piece of `text` between delimiters, trimmed, leaving out the empty
// ones and repeats.
function split(text: string, delimiter: string) {
  const pieces = delimiter === '' ? [text] : text.split(delimiter);

  return [...new Set(pieces.map((piece) => piece.trim()).filter(Boolean))];
}
