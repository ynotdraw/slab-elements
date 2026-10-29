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
import AriaForwarding from './library/aria-forwarding.js';
import customElement from './library/custom-element.js';
import required from './library/required.js';
import styles from './slider.styles.js';
import afterReflection from './library/after-reflection.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-slider': Slider;
  }
}

/**
 * A single-thumb slider with no visual styles, around a native range input, so
 * it is dragged, stepped with the keyboard, and read the way one is.
 *
 * The label and the input are both in the shadow root, so a plain `for`
 * reference names it without crossing out of one. The host delegates focus, so
 * clicking anywhere on it, or a `<label for>` pointing at it, focuses the
 * input.
 *
 * The value is the native input's. `min`, `max` and `step` are passed through
 * to it, and `value` is read back from it, so a value outside the range or off
 * a step is clamped and snapped the way a range input does it. With no value,
 * it sits halfway between `min` and `max`, as a range input does.
 *
 * Style it through its parts and through `:state(disabled)`. Where the label
 * sits relative to the input is layout, so it's left to the styles around it.
 *
 * @attr {string} label
 * @attr {boolean} [disabled=false]
 * @attr {boolean} [hide-label=false]
 * @attr {number} [max] - 100 when unset, as on a range input.
 * @attr {number} [min] - 0 when unset, as on a range input.
 * @attr {string} [name='']
 * @attr {number|'any'} [step] - A number, or "any" to allow any value. Left unset, the input's own default of 1 applies.
 * @attr {string} [value=''] - Like a native input, the attribute is the default value and the property is the current one. The property is always the value the input settled on, so it's never outside the range or off a step.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} [description] - Text about the slider, such as a hint
 *
 * @csspart description - Text about the slider, such as a hint
 * @csspart input
 * @csspart label - The label
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
@customElement('slab-slider')
export default class Slider extends LitElement {
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

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  /**
   * 100 when unset, as on a range input.
   */
  @property({ reflect: true, type: Number })
  max?: number;

  /**
   * 0 when unset, as on a range input.
   */
  @property({ reflect: true, type: Number })
  min?: number;

  @property({ reflect: true, useDefault: true })
  name = '';

  /**
   * A number, or "any" to allow any value. Left unset, the input's own default
   * of 1 applies.
   */
  @property({
    converter: {
      // "any" is the one keyword the input takes. Anything else is a number,
      // and one that isn't is left for the input to ignore, as it would. A
      // removed attribute is `null`, which `Number()` would turn into 0.
      fromAttribute(value) {
        if (value === null) {
          return;
        }

        return value === 'any' ? 'any' : Number(value);
      },
    },
    reflect: true,
  })
  step?: number | 'any';

  /**
   * Like a native input, the attribute is the default value and the property
   * is the current one. The property is always the value the input settled
   * on, so it's never outside the range or off a step.
   *
   * @default ''
   */
  @property()
  get value(): string {
    // Read from the input rather than stored, so it's the sanitized value: a
    // range input clamps to `min` and `max` and snaps to `step` on its own.
    return this.#inputElementRef.value?.value ?? this.#value;
  }

  set value(value: string) {
    const old = this.value;

    this.#value = value;

    if (this.#inputElementRef.value) {
      this.#inputElementRef.value.value = value;
    }

    this.requestUpdate('value', old);
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
    // An empty value puts a range input back halfway, which is also what a
    // native one resets to when it has no `value` attribute.
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
    // There's no `role` or `aria-value*` here. A range input is a slider to
    // the platform already, with its value, minimum and maximum.
    return html`<label for="input" part="label">
        <!-- The label -->
        ${this.label}
      </label>

      <input
        aria-describedby="description"
        data-test="input"
        id="input"
        max=${ifDefined(this.max)}
        min=${ifDefined(this.min)}
        part="input"
        type="range"
        ?disabled=${this.#isDisabled}
        @change=${this.#onInputChangeOrInput}
        @input=${this.#onInputChangeOrInput}
        ${ref(this.#inputElementRef)}
      />

      <slot id="description" name="description" part="description">
        <!--
          Text about the slider, such as a hint
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
    const input = this.#inputElementRef.value;

    // Set here rather than in the template because lit-analyzer types the
    // input's `step` as a number, and "any" is the one value that isn't.
    // Removed rather than emptied when unset, so the input's default of 1
    // applies. Before the value below, which is snapped to it.
    if (input && this.step === undefined) {
      input.removeAttribute('step');
    } else if (input) {
      input.step = String(this.step);
    }

    // Set here as well as in the setter because the input doesn't exist before
    // the first render, and because a value is sanitized against the `min`,
    // `max` and `step` it's set under. Setting it again once they've rendered
    // means `max="200" value="150"` lands on 150 whichever is set first.
    if (
      input &&
      (changes.has('value') ||
        changes.has('min') ||
        changes.has('max') ||
        changes.has('step'))
    ) {
      input.value = this.#value;
    }

    if (changes.has('disabled') || changes.has('isFormDisabled')) {
      this.#setState('disabled', this.#isDisabled);
    }

    this.#updateFormValue();
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

  #value = '';

  get #isDisabled() {
    return this.disabled || this.isFormDisabled;
  }

  #onInputChangeOrInput(event: Event) {
    if (event.target instanceof HTMLInputElement) {
      this.value = event.target.value;
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

  #updateFormValue() {
    const isSubmittable = !this.#isDisabled && this.name !== '';
    this.#internals.setFormValue(isSubmittable ? this.value : null);
  }
}
