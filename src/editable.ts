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
import packageJson from '../package.json' with { type: 'json' };
import afterReflection from './library/after-reflection.js';
import customElement from './library/custom-element.js';
import required from './library/required.js';
import styles from './editable.styles.js';

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
 * Style it through its parts and through `:state(disabled)`,
 * `:state(editing)` and `:state(empty)`. While it's empty, the button shows
 * `placeholder`.
 *
 * @attr {string} label
 * @attr {boolean} [disabled=false]
 * @attr {boolean} [editing=false] - Whether the input is showing rather than the button. Setting it doesn't move focus. `edit()` does.
 * @attr {boolean} [hide-label=false]
 * @attr {number} [maxlength]
 * @attr {string} [name='']
 * @attr {string} [placeholder] - Shown on the button while it's empty, and in the input.
 * @attr {string} [value=''] - Like a native input, the attribute is the default value and the property is the current one, so the attribute doesn't change as edits are committed.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} [description]
 *
 * @csspart description - Text about the field
 * @csspart input
 * @csspart label - The label
 * @csspart preview - The button, while not editing
 *
 * @fires {Event} change
 *
 * @readonly
 * @prop {HTMLFormElement | null} form
 *
 * @method cancel - Stops editing and discards what's typed.
 * @method commit - Stops editing and keeps what's typed.
 *
 * @method edit - Starts editing and focuses the input, with its text selected.
 * @returns Promise<void>
 *
 * @method formDisabledCallback
 * @param {boolean} isDisabled
 *
 * @method formResetCallback
 *
 * @method formStateRestoreCallback
 * @param {string | File | FormData | null} state
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

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  /**
   * Stops editing and discards what's typed.
   */
  cancel(): void {
    this.#stopEditing({ isCommit: false });
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
              @click=${this.#onPreviewClick}
              ${ref(this.#previewElementRef)}
            >
              <!-- The button, while not editing -->
              ${this.value === '' ? this.placeholder : this.value}
            </button>`
      }

      <div id="description" part="description">
        <!-- Text about the field -->
        <slot name="description">
          <!-- @type {Element | string} -->
        </slot>
      </div>`;
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

  #inputElementRef = createRef<HTMLInputElement>();

  #internals: ElementInternals;

  #previewElementRef = createRef<HTMLButtonElement>();

  get #isDisabled() {
    return this.disabled || this.isFormDisabled;
  }

  #onInputBlur() {
    // Enter and Escape stop editing before the input goes, so there's nothing
    // left to commit when a browser blurs it on the way out. And a browser
    // blurs it when a fieldset around the host is disabled, before
    // `formDisabledCallback()`, which discards what's typed rather than
    // committing it.
    if (this.editing && !this.matches(':disabled')) {
      this.commit();
    }
  }

  // The native input's "input" composes, and would leave the shadow root as
  // the host's even though `value` hasn't changed. It's an edit in progress,
  // so it's kept inside.
  #onInputInput(event: Event) {
    event.stopPropagation();
  }

  async #onInputKeydown(event: KeyboardEvent) {
    // An IME uses Enter and Escape to finish or abandon a composition.
    if (event.isComposing) {
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
