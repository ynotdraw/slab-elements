import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { property, state } from 'lit/decorators.js';
import packageJson from '../package.json' with { type: 'json' };
import AriaForwarding from './library/aria-forwarding.js';
import customElement from './library/custom-element.js';
import required from './library/required.js';
import styles from './switch.styles.js';
import afterReflection from './library/after-reflection.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-switch': Switch;
  }
}

/**
 * A switch with no visual styles, around a native checkbox, so it is checked,
 * focused, and read the way one is.
 *
 * The label and the switch are both in the shadow root, so a plain `for`
 * reference names it without crossing out of one. The host delegates focus, so
 * clicking anywhere on it, or a `<label for>` pointing at it, focuses the
 * switch.
 *
 * Style it through its parts and through `:state(checked)`,
 * `:state(disabled)`, and `:state(required)`. Where the label sits relative to
 * the switch is layout, so it's left to the styles around it.
 *
 * @attr {string} label
 * @attr {boolean} [checked=false] - Like a native checkbox, the attribute is the default state and the property is the current one, so the attribute doesn't change as the switch is toggled. Style `:state(checked)` rather than `[checked]`.
 * @attr {boolean} [disabled=false]
 * @attr {boolean} [hide-label=false]
 * @attr {string} [name='']
 * @attr {boolean} [required=false]
 * @attr {string} [value='on']
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} [description] - Text about the switch, such as a hint or an error
 *
 * @csspart description - Text about the switch, such as a hint or an error
 * @csspart input
 * @csspart label - The label
 * @csspart switch - The switch itself
 *
 * @fires {Event} change
 * @fires {Event} input
 *
 * @readonly
 * @prop {HTMLFormElement | null} form
 *
 * @readonly
 * @prop {ValidityState} validity
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
 */
@customElement('slab-switch')
export default class Switch extends LitElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ reflect: true })
  @required
  label?: string;

  /**
   * Like a native checkbox, the attribute is the default state and the
   * property is the current one, so the attribute doesn't change as the switch
   * is toggled. Style `:state(checked)` rather than `[checked]`.
   */
  @property({ type: Boolean })
  checked = false;

  @property({ reflect: true, type: Boolean })
  disabled = false;

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  @property({ reflect: true, useDefault: true })
  name = '';

  @property({ reflect: true, type: Boolean })
  required = false;

  @property({ reflect: true, useDefault: true })
  value = 'on';

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  get validity(): ValidityState {
    return this.#internals.validity;
  }

  checkValidity(): boolean {
    return this.#internals.checkValidity();
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
    this.checked = this.hasAttribute('checked');
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.checked = state === this.value;
  }

  override render() {
    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    return html`<label for="input" part="label">
        <!-- The label -->
        ${this.label}
      </label>

      <span part="switch">
        <!-- The switch itself -->
        <input
          aria-checked=${this.checked ? 'true' : 'false'}
          aria-describedby="description"
          id="input"
          part="input"
          role="switch"
          type="checkbox"
          .checked=${this.checked}
          ?disabled=${this.#isDisabled}
          ?required=${this.required}
          @change=${this.#onChangeOrInput}
          @input=${this.#onChangeOrInput}
          ${ref(this.#inputElementRef)}
        />
      </span>

      <slot id="description" name="description" part="description">
        <!--
          Text about the switch, such as a hint or an error
          @type {Element | string}
        -->
      </slot>`;
  }

  reportValidity(): boolean {
    return this.#internals.reportValidity();
  }

  // Untyped because `isFormDisabled` is private, and `PropertyValues<this>`
  // only knows public keys.
  override updated(changes: PropertyValues) {
    if (changes.has('disabled') || changes.has('isFormDisabled')) {
      this.#setState('disabled', this.#isDisabled);
    }

    if (changes.has('checked')) {
      this.#setState('checked', this.checked);
    }

    if (changes.has('required')) {
      this.#setState('required', this.required);
    }

    this.#updateFormValueAndValidity();
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
    target: () => this.#inputElementRef.value,
  });

  #inputElementRef = createRef<HTMLInputElement>();

  #internals: ElementInternals;

  get #isDisabled() {
    return this.disabled || this.isFormDisabled;
  }

  // Only "change" would need handling if not for consumers who force the
  // switch back to a state until the user has done something else. They do
  // that by setting `checked` inside a handler, after awaiting
  // `updateComplete` so their change isn't reverted by the update this one
  // causes. Awaiting it requires an update to already be pending, which is why
  // "input" is handled too rather than only "change".
  #onChangeOrInput(event: Event) {
    if (event.target instanceof HTMLInputElement) {
      this.checked = event.target.checked;
    }

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

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  #updateFormValueAndValidity() {
    this.#internals.setFormValue(this.checked ? this.value : null);

    if (this.required && !this.checked) {
      this.#internals.setValidity(
        { valueMissing: true },
        ' ',
        this.#inputElementRef.value,
      );
    } else {
      this.#internals.setValidity({});
    }
  }
}
