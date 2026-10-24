import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { when } from 'lit/directives/when.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import assertSlot from './library/assert-slot.js';
import afterReflection from './library/after-reflection.js';
import OptionsController from './library/options-controller.js';
import TagsController from './library/tags-controller.js';
import isFormCheckingValidity from './library/is-form-checking-validity.js';
import required from './library/required.js';
import Option from './option.js';
import styles from './combobox.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-combobox': Combobox;
  }
}

/**
 * A text input that filters a list of Options as it's typed into, with no
 * visual styles. It's the APG's editable combobox with list autocomplete.
 *
 * Not `<input list>`. A `<datalist>` holds only text, can't be styled, and is
 * drawn differently by every browser, down to whether it filters by prefix or
 * by substring. So this is a real `<input role="combobox">` with a
 * `<div role="listbox">` of slotted Options in a popover beside it.
 *
 * The listbox is its own rather than a nested Listbox. A Listbox has a label,
 * a Tab stop and a form value of its own, all of which a Combobox would have
 * to switch off. What it shares with Listbox is Option, OptionsController, and
 * the way the active
 * Option is pointed at rather than focused: focus stays in the input, and the
 * input's `aria-activedescendant` is set as an element, since an IDREF can't
 * reach the slotted Options. Read or set it with `activeOption`.
 *
 * Typing filters the Options by `filter`, a case-insensitive substring of each
 * Option's text unless it's replaced, and opens the listbox. An Option that
 * doesn't match is hidden, so it's out of the accessibility tree and skipped by
 * the arrow keys. With none left, the listbox closes and the host matches
 * `:state(empty)`, for a "no results" message of your own.
 *
 * ArrowDown and ArrowUp open the listbox and move the active Option, stopping
 * at each end and skipping disabled Options. Alt with ArrowDown opens it
 * without moving, and Alt with ArrowUp closes it. Enter and a click select the
 * active Option and close the listbox. Escape closes it, and a second Escape
 * clears the input. Home, End and the other caret keys stay the input's. A
 * click or Tab elsewhere closes it, since either takes focus from the input.
 *
 * `value` is the selected Option's value, not what's in the input, which shows
 * that Option's text. Unless `allow-custom` is set, what's typed has to name an
 * Option: when focus leaves, text that matches one's (ignoring case) selects
 * it, an empty input clears the selection, and anything else goes back to the
 * selected Option's text. With `allow-custom`, text that matches no Option is
 * the value as typed. Either way, `value` is what's submitted, and "input" and
 * "change" are dispatched together when it changes, as on a `<select>`, rather
 * than on every keystroke.
 *
 * With `multiple`, choosing an Option toggles it and leaves the listbox open,
 * and what's typed is cleared rather than replaced by the Option's text. Each
 * selected value is shown before the input as a tag, a `<button>` that
 * removes it. Backspace in an empty input removes the last, and Left at the
 * start of the input moves focus to the tags, where Left and Right move
 * between them and Backspace, Delete, Enter and Space remove one. They aren't
 * Tab stops, so Tab still leaves the Combobox in one press. `values` lists the
 * selected values in the order they were chosen, and each is submitted as its
 * own entry, as a `<select multiple>` submits them. Text that names an Option
 * adds it, and with `allow-custom` so does text that names none.
 *
 * Style it through its parts and through `:state(disabled)`, `:state(empty)`,
 * `:state(error)`, `:state(open)` and `:state(required)`, and each Option
 * through `:state(active)`, `:state(disabled)` and `:state(selected)`. The
 * tags are `::part(tag)`, in `::part(tags)`.
 *
 * @attr {string} label
 * @attr {boolean} [allow-custom=false] - Lets the value be text that matches no Option.
 * @attr {boolean} [disabled=false]
 * @attr {boolean} [hide-label=false]
 * @attr {boolean} [multiple=false] - Lets more than one Option be selected, each shown as a tag that removes it.
 * @attr {string} [name='']
 * @attr {boolean} [open=false]
 * @attr {string} [placeholder]
 * @attr {'bottom'|'top'} [placement='bottom'] - The side of the input the listbox opens on, when there's room. It flips when there isn't.
 * @attr {boolean} [required=false]
 * @attr {string} [value=''] - The selected Option's value, or the typed text when `allow-custom` is set and it matches no Option. The first of `values` when `multiple` is set. Setting it selects the Option with that value, and only that one. Like a native input, the attribute is the default value and the property is the current one.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Option}
 * @slot {Element | string} [description]
 *
 * @csspart description - Text about the Combobox, and its validity message when it has one
 * @csspart input
 * @csspart label - The label
 * @csspart listbox - The Options, in a popover beside the input
 * @csspart tag - A selected value's button, which removes it
 * @csspart tags - The tags
 * @csspart validity-message
 *
 * @fires {Event} change
 * @fires {Event} input
 *
 * @prop {Option | null} activeOption - The Option the user is on, which Enter selects. It's pointed at rather than focused, so focus stays in the input.
 * @prop {(option: Option, query: string) => boolean} filter - Whether an Option matches what's been typed. A case-insensitive substring of its text by default.
 *
 * @readonly
 * @prop {HTMLFormElement | null} form
 *
 * @readonly
 * @prop {Option[]} options
 *
 * @prop {(text: string) => string} removeLabel - Names each tag's button, which shows only the selected Option's text, from that text. "Remove" and the text when unset.
 *
 * @readonly
 * @prop {Option | null} selectedOption
 *
 * @readonly
 * @prop {Option[]} selectedOptions - The Options of `values`, in the same order. Values that name no Option are left out.
 *
 * @readonly
 * @prop {ValidityState} validity
 *
 * @prop {string[]} values - Every selected value, in the order they were chosen. Only the first when `multiple` isn't set. Setting it selects the Options with those values, and only those.
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
@customElement('slab-combobox')
export default class Combobox extends LitElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ reflect: true })
  @required
  label?: string;

  /**
   * Lets the value be text that matches no Option.
   */
  @property({ attribute: 'allow-custom', reflect: true, type: Boolean })
  allowCustom = false;

  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * Whether an Option matches what's been typed. A case-insensitive substring
   * of its text by default.
   */
  @property({ attribute: false })
  filter: (option: Option, query: string) => boolean = (option, query) => {
    return option.text.toLowerCase().includes(query.toLowerCase());
  };

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  /**
   * Lets more than one Option be selected, each shown as a tag that removes
   * it.
   */
  @property({ reflect: true, type: Boolean })
  multiple = false;

  @property({ reflect: true, useDefault: true })
  name = '';

  @property({ reflect: true, type: Boolean })
  open = false;

  @property({ reflect: true })
  placeholder?: string;

  /**
   * The side of the input the listbox opens on, when there's room. It flips
   * when there isn't.
   */
  @property({ reflect: true, useDefault: true })
  placement: 'bottom' | 'top' = 'bottom';

  /**
   * Names each tag's button, which shows only the selected Option's text,
   * from that text. "Remove" and the text when unset.
   */
  @property({ attribute: false })
  removeLabel: (text: string) => string = (text) => `Remove ${text}`;

  @property({ reflect: true, type: Boolean })
  required = false;

  /**
   * The selected Option's value, or the typed text when `allow-custom` is set
   * and it matches no Option. The first of `values` when `multiple` is set.
   * Setting it selects the Option with that value, and only that one. Like a
   * native input, the attribute is the default value and the property is the
   * current one.
   *
   * @default ''
   */
  @property()
  get value(): string {
    return this.values.at(0) ?? '';
  }

  set value(value: string) {
    this.values = value === '' ? [] : [value];
  }

  /**
   * Every selected value, in the order they were chosen. Only the first when
   * `multiple` isn't set. Setting it selects the Options with those values,
   * and only those.
   *
   * @default []
   */
  @property({ attribute: false })
  get values(): string[] {
    const values =
      this.#values ?? this.#declaredOptions.map(({ value }) => value);

    return this.multiple ? values : values.slice(0, 1);
  }

  set values(values: string[]) {
    this.#values = values;
  }

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  /**
   * The Option the user is on, which Enter selects. It's pointed at rather
   * than focused, so focus stays in the input.
   *
   * @default null
   */
  get activeOption(): Option | null {
    return this.#options.activeOption;
  }

  set activeOption(option: Option | null) {
    // One that isn't shown can't be pointed at. See `#options`.
    this.#options.activeOption = option;
  }

  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  // Those assigned to its default slot, for the same reasons as Listbox's.
  get options(): Option[] {
    return this.#options.options;
  }

  get selectedOption(): Option | null {
    return this.options.find(({ value }) => value === this.value) ?? null;
  }

  /**
   * The Options of `values`, in the same order. Values that name no Option
   * are left out.
   */
  get selectedOptions(): Option[] {
    return this.values.flatMap((value) => {
      return this.options.find((option) => option.value === value) ?? [];
    });
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
    const value = this.getAttribute('value');

    // Back to the Options that say they're selected unless there's an
    // initial `value`, the way a `<select>` is reset.
    this.#values = undefined;

    if (value !== null) {
      this.value = value;
    }

    this.#query = undefined;
    this.open = false;
    this.resetValidityFeedback();
    this.requestUpdate();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === 'string') {
      this.value = state;
    } else if (state instanceof FormData) {
      this.values = state
        .getAll(this.name)
        .filter((value): value is string => typeof value === 'string');
    } else {
      this.values = [];
    }

    this.#query = undefined;
    this.requestUpdate();
  }

  override render() {
    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    //
    // `aria-activedescendant` is the exception. See the `activeOption` setter.
    //
    // The input is named by its label's `for`, which the lint rule can't see.
    // The listbox is never focused, so its keyboard is the input's.
    //
    /* eslint-disable lit-a11y/accessible-name, lit-a11y/click-events-have-key-events */
    return html`<label for="input" id="label" part="label">
        <!-- The label -->
        ${this.label}
      </label>

      ${when(this.multiple, () => this.#renderTags())}

      <input
        aria-autocomplete="list"
        aria-controls="listbox"
        aria-describedby=${this.multiple ? 'selected description' : 'description'}
        aria-expanded=${this.open ? 'true' : 'false'}
        aria-invalid=${this.#isShowValidationFeedback ? 'true' : 'false'}
        autocomplete="off"
        data-test="input"
        id="input"
        part="input"
        placeholder=${ifDefined(this.placeholder)}
        role="combobox"
        type="text"
        ?disabled=${this.#isDisabled}
        @blur=${this.#onInputBlur}
        @change=${this.#onInputChange}
        @click=${this.#onInputClick}
        @input=${this.#onInputInput}
        @keydown=${this.#onInputKeydown}
        ${ref(this.#inputElementRef)}
      />

      <!--
        "manual" rather than "auto". Focus never leaves the input while the
        listbox is open, so leaving the input is what dismisses it, and the
        input handles Escape. "auto" would close it on a click in the input,
        and close a consumer's other popovers when it opens.

        Its "mousedown" is cancelled so a click on an Option doesn't take focus
        from the input, which would close the listbox before the click lands.
      -->
      <div
        aria-labelledby="label"
        aria-multiselectable=${this.multiple ? 'true' : 'false'}
        data-test="listbox"
        id="listbox"
        part="listbox"
        .popover=${'manual'}
        role="listbox"
        @click=${this.#onListboxClick}
        @mousedown=${this.#onListboxMousedown}
        ${ref(this.#listboxElementRef)}
      >
        <!-- The Options, in a popover beside the input -->
        <slot ${assertSlot([Option])} ${ref(this.#slotElementRef)}>
          <!-- @type {Option} -->
        </slot>
      </div>

      <div id="description" part="description">
        <!-- Text about the Combobox, and its validity message when it has one -->
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

  override updated(changes: PropertyValues<this>) {
    const visible = this.#visible;

    const selected = this.multiple
      ? this.selectedOptions
      : [this.selectedOption];

    for (const option of this.options) {
      option.hidden = !visible.includes(option);
      option.selected = selected.includes(option);
    }

    this.#updateText();

    if (changes.has('open')) {
      this.#togglePopover();
    }

    // Closing leaves nothing to point at. Filtering it out does too, which
    // OptionsController sees to.
    if (!this.open) {
      this.#options.activeOption = null;
    }

    this.#setState('disabled', this.#isDisabled);
    this.#setState('empty', visible.length === 0);
    this.#setState('open', this.open);
    this.#setState('required', this.required);
    this.#updateFormValue();
    this.#updateValidity();
    this.#setState('error', this.#isShowValidationFeedback);
  }

  override willUpdate() {
    // Nothing to show, or nothing to choose from.
    if (this.#isDisabled || this.#visible.length === 0) {
      this.open = false;
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

  #hasCustomValidity = false;

  #inputElementRef = createRef<HTMLInputElement>();

  #internals: ElementInternals;

  #listboxElementRef = createRef<HTMLDivElement>();

  // Selection is left off. What's selected follows `value`, which may be text
  // that matches no Option, so it's set in `updated()` instead. Options that
  // don't match what's been typed aren't shown, so they can't be active and
  // the arrow keys skip them.
  #options = new OptionsController(this, {
    activeDescendantElement: () => this.#inputElementRef.value,
    isDisabled: () => this.#isDisabled,
    isSelecting: false,
    isShown: (option) => this.#isVisible(option),
    onChange: () => {
      this.requestUpdate();
    },
    slot: () => this.#slotElementRef.value,
  });

  // the input shows the value. Filters the Options while there's something.
  #query?: string;

  // What's been typed since the value was last committed, or `undefined` when
  #slotElementRef = createRef<HTMLSlotElement>();

  #tags = new TagsController(this, {
    input: () => this.#inputElementRef.value,
    isDisabled: () => this.#isDisabled,
    label: (text) => this.removeLabel(text),
    onBlur: (event) => {
      this.#onBlur(event);
    },
    onRemove: (index) => {
      this.#remove(this.values[index]);
    },
  });

  // What `values` was set to. Until it's set, the Options that say they're
  // `selected` are the values, the way a `<select>`'s are.
  #values?: string[];

  // What a validation message is anchored to, so reporting validity takes
  // focus somewhere sensible.
  get #anchor() {
    return this.#inputElementRef.value;
  }

  // What's in the input, which is only read once there's an input to read.
  get #text() {
    /* v8 ignore next */
    return this.#inputElementRef.value?.value ?? '';
  }

  get #declaredOptions() {
    return this.options.filter((option) => option.hasAttribute('selected'));
  }

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

  // The Options that match what's been typed. All of them until something is.
  get #visible() {
    return this.options.filter((option) => this.#isVisible(option));
  }

  #onInputBlur = (event: FocusEvent) => {
    this.#commit();
    this.open = false;
    this.#onBlur(event);
  };

  // "change" doesn't compose and never leaves the shadow root, but it's
  // stopped anyway so it's plain that the host's own is the only one.
  #onInputChange = (event: Event) => {
    event.stopPropagation();
  };

  #onInputClick = () => {
    this.open = true;
  };

  #onInputInput = (event: Event) => {
    // "input" composes, so it's stopped or it would escape the shadow root.
    // The host's own is dispatched when the value changes, not on every
    // keystroke.
    event.stopPropagation();

    this.#query = this.#text;
    this.activeOption = null;
    this.open = true;
    this.requestUpdate();
  };

  #onInputKeydown = (event: KeyboardEvent) => {
    const options = this.#options;
    const active = options.activeOption;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); // Keep the caret where it is

      if (event.altKey) {
        this.open = event.key === 'ArrowDown';

        return;
      }

      // Opening starts on the selected Option, so the user picks up where
      // they left off. From nothing, ArrowUp starts at the end, the way the
      // APG has it.
      const selected = this.selectedOption;

      if (
        !this.open &&
        selected &&
        options.navigableOptions.includes(selected)
      ) {
        options.activeOption = selected;
      } else if (event.key === 'ArrowDown') {
        options.next();
      } else {
        options.previous();
      }

      this.open = true;

      return;
    }

    if (event.key === 'Enter') {
      // What's typed becomes a tag rather than submitting part-way through.
      const isAdding = this.multiple && this.#text !== '';

      if (!this.open && !isAdding) {
        this.#commit();
        this.form?.requestSubmit();

        return;
      }

      event.preventDefault(); // So a form isn't submitted mid-choice

      if (active) {
        this.#select(active);
      } else {
        this.#commit();
      }

      // Left open when `multiple`, for the next one, unless there was nothing
      // to choose.
      this.open = this.multiple && this.open && (active !== null || isAdding);

      return;
    }

    // Left alone when there's nothing to close or clear, so a Dialog or
    // Drawer around it still closes.
    if (event.key === 'Escape' && (this.open || this.#text !== '')) {
      event.preventDefault();

      if (this.open) {
        this.open = false;

        return;
      }

      // The APG's second Escape. Rendering empties the input, now that it
      // shows the value again. With `multiple`, only what's typed is
      // cleared, rather than every tag at once.
      this.#query = undefined;

      if (!this.multiple) {
        this.#setValue('');
      }

      this.requestUpdate();

      return;
    }

    const input = this.#inputElementRef.value;

    const isAtStart = input?.selectionStart === 0 && input.selectionEnd === 0;

    if (this.multiple && event.key === 'Backspace' && this.#text === '') {
      const last = this.values.at(-1);

      if (last !== undefined) {
        event.preventDefault();
        this.#remove(last);
      }

      return;
    }

    if (
      this.multiple &&
      event.key === 'ArrowLeft' &&
      isAtStart &&
      this.#tags.focusLast()
    ) {
      event.preventDefault();

      return;
    }

    // The caret moving means the user is back in the input.
    if (['ArrowLeft', 'ArrowRight', 'End', 'Home'].includes(event.key)) {
      options.activeOption = null;
    }
  };

  #onListboxClick = (event: MouseEvent) => {
    const option = this.options.find((option) => {
      return event.target instanceof Node && option.contains(event.target);
    });

    if (!option || option.disabled) {
      return;
    }

    this.#select(option);

    // Left open when `multiple`, for the next one.
    this.open = this.multiple;
  };

  #onListboxMousedown = (event: MouseEvent) => {
    event.preventDefault();
  };

  // Settles what's been typed into a value. See the class description.
  #commit() {
    const query = this.#query;

    if (query === undefined) {
      return;
    }

    this.#query = undefined;

    const match = this.options.find(({ disabled, text }) => {
      return !disabled && text.toLowerCase() === query.trim().toLowerCase();
    });

    // Added rather than toggled when `multiple`, so text that names a tag
    // that's already there doesn't remove it.
    if (this.multiple) {
      const value = match?.value ?? (this.allowCustom ? query.trim() : '');

      if (value !== '' && !this.values.includes(value)) {
        this.#setValues([...this.values, value]);
      }
    } else if (match) {
      this.#select(match);
    } else if (query === '' || this.allowCustom) {
      this.#setValue(query);
    }

    this.requestUpdate();
  }

  #isVisible(option: Option) {
    const query = this.#query ?? '';
    const { filter } = this;

    return query === '' || filter(option, query);
  }

  // Only when focus leaves the Combobox. Moving between the input and the
  // tags is still being in it.
  #onBlur(event: FocusEvent) {
    const isInside =
      event.relatedTarget instanceof Node &&
      this.renderRoot.contains(event.relatedTarget);

    if (isInside) {
      return;
    }

    this.isBlurring = true;
    this.reportValidity();
    this.isBlurring = false;
  }

  #remove(value?: string) {
    this.#setValues(this.values.filter((other) => other !== value));
    this.requestUpdate();
  }

  #renderTags() {
    const selected = this.values.map((value) => {
      return {
        text: this.options.find((option) => option.value === value)?.text,
        value,
      };
    });

    // The input is described by the selected values' text rather than by the
    // tags, whose names each start with "Remove". A `hidden` element can still
    // describe one.
    return html`<span hidden id="selected">
        ${selected.map(({ text, value }) => text ?? value).join(', ')}
      </span>

      <div part="tags">
        <!--
          The tags
          @part tag - A selected value's button, which removes it
        -->
        ${this.#tags.render(
          selected.map(({ text, value }) => ({ text: text ?? value, value })),
        )}
      </div>`;
  }

  // Toggled when `multiple`, so choosing a selected Option again removes it.
  #select(option: Option) {
    this.#query = undefined;

    if (this.multiple) {
      this.#setValues(
        this.values.includes(option.value)
          ? this.values.filter((value) => value !== option.value)
          : [...this.values, option.value],
      );
    } else {
      this.#setValue(option.value);
    }

    this.requestUpdate();
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  // A value the user chose, with the events a native control dispatches.
  #setValue(value: string) {
    this.#setValues(value === '' ? [] : [value]);
  }

  #setValues(values: string[]) {
    const isChange =
      values.length !== this.values.length ||
      values.some((value, index) => value !== this.values[index]);

    if (!isChange) {
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

  #togglePopover() {
    const listbox = this.#listboxElementRef.value;

    /* v8 ignore next 3 */
    if (!listbox) {
      return;
    }

    const isOpen = listbox.matches(':popover-open');

    if (this.open && !isOpen) {
      listbox.showPopover();
    } else if (!this.open && isOpen) {
      listbox.hidePopover();
    }
  }

  #updateFormValue() {
    const isSubmittable = !this.#isDisabled && this.name !== '';

    if (!isSubmittable || !this.multiple) {
      this.#internals.setFormValue(isSubmittable ? this.value : null);

      return;
    }

    // One entry per value, the way a native `<select multiple>` submits.
    const data = new FormData();

    for (const value of this.values) {
      data.append(this.name, value);
    }

    this.#internals.setFormValue(data);
  }

  // What's typed is left alone until it's committed. Otherwise the input shows
  // the selected Option, and is kept in step with Options that are added or
  // renamed later. With `multiple` the tags show what's selected, so the input
  // is left empty for the next one.
  #updateText() {
    const input = this.#inputElementRef.value;

    /* v8 ignore next 3 */
    if (!input) {
      return;
    }

    if (this.#query === undefined) {
      input.value = this.multiple
        ? ''
        : (this.selectedOption?.text ?? this.value);
    }
  }

  #updateValidity() {
    // The consumer owns validity once they've set it themselves.
    if (this.#hasCustomValidity) {
      return;
    }

    if (this.required && this.values.every((value) => value === '')) {
      this.#internals.setValidity(
        { customError: Boolean(this.validityMessage), valueMissing: true },
        ' ',
        this.#anchor,
      );

      return;
    }

    this.#internals.setValidity({});
  }
}
