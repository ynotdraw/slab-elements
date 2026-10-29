import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import assertSlot from './library/assert-slot.js';
import uniqueId from './library/unique-id.js';
import styles from './field.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-field': Field;
  }
}

/**
 * A label and the control it names, with no visual styles.
 *
 * Field wires the two together. Both are slotted, so they're in the same tree
 * and no ID reference has to cross a shadow root: Field gives the control an
 * `id` and points the label's `for` at it. A `for` or an `id` that's already
 * set is left alone, so a consumer who wants to wire it themselves can.
 *
 * The control is described by each element slotted into `description`,
 * through its `aria-describedby`, after any IDs it already has. And `error`
 * sets its `aria-invalid`, so a screenreader says it's invalid and reads the
 * description that says why.
 *
 * Beyond that, what Field provides is a place for each piece and custom states
 * for what a design needs to know about them: `:state(disabled)`,
 * `:state(error)`, and `:state(required)`.
 *
 * `required` renders nothing. A design that wants an asterisk adds one from
 * outside, through `::part(label)`. Layout is the same: where the label sits
 * relative to its control is for the styles around it, not for this class.
 *
 * `hide-label` hides the label visually and leaves it where screenreaders and
 * a `<label for>` can still reach it.
 *
 * @attr {boolean} [disabled=false]
 * @attr {boolean} [error=false]
 * @attr {boolean} [hide-label=false]
 * @attr {boolean} [required=false]
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string}
 * @slot {Element} [control]
 * @slot {Element | string} [description]
 *
 * @csspart control - The control the label names
 * @csspart description - Text about the control, such as a hint or an error
 * @csspart label - The label
 */
@customElement('slab-field')
export default class Field extends LitElement {
  @property({ reflect: true, type: Boolean })
  disabled = false;

  @property({ reflect: true, type: Boolean })
  error = false;

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  @property({ reflect: true, type: Boolean })
  required = false;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  override render() {
    return html`<div part="label">
        <!-- The label -->
        <slot @slotchange=${this.#onSlotChange} ${assertSlot()}>
          <!-- @type {Element | string} -->
        </slot>
      </div>

      <div part="control">
        <!-- The control the label names -->
        <slot name="control" @slotchange=${this.#onSlotChange} ${assertSlot()}>
          <!-- @type {Element} -->
        </slot>
      </div>

      <div part="description">
        <!-- Text about the control, such as a hint or an error -->
        <slot name="description" @slotchange=${this.#onSlotChange}>
          <!-- @type {Element | string} -->
        </slot>
      </div>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('disabled')) {
      this.#setState('disabled', this.disabled);
    }

    if (changes.has('error')) {
      this.#setState('error', this.error);
      this.#markInvalid();
    }

    if (changes.has('required')) {
      this.#setState('required', this.required);
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

  // The control Field described, and the IDs it added to its
  // `aria-describedby`, so it's only ever those that it takes away again.
  #described?: { control: Element; ids: string[] };

  #internals: ElementInternals;

  // The control Field set `aria-invalid` on, so it's only ever that one it
  // takes it off again.
  #invalidated?: Element;

  get #control() {
    return this.querySelector('[slot="control"]');
  }

  // The descriptions are slotted, as the control is, so they're in the same
  // tree and an ID reaches across. The control's own IDs are kept, so a
  // consumer can describe it by something else as well.
  #describe() {
    if (this.#described) {
      const { control, ids } = this.#described;

      const kept = (control.getAttribute('aria-describedby') ?? '')
        .split(' ')
        .filter((id) => id && !ids.includes(id));

      if (kept.length > 0) {
        control.setAttribute('aria-describedby', kept.join(' '));
      } else {
        control.removeAttribute('aria-describedby');
      }

      this.#described = undefined;
    }

    const control = this.#control;
    const descriptions = this.querySelectorAll('[slot="description"]');

    if (!control || descriptions.length === 0) {
      return;
    }

    const ids = [...descriptions].map((description) => {
      description.id ||= uniqueId();
      return description.id;
    });

    const own = (control.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .filter(Boolean);

    control.setAttribute('aria-describedby', [...own, ...ids].join(' '));
    this.#described = { control, ids };
  }

  #markInvalid() {
    this.#invalidated?.removeAttribute('aria-invalid');
    this.#invalidated = undefined;

    const control = this.#control;

    if (this.error && control) {
      control.setAttribute('aria-invalid', 'true');
      this.#invalidated = control;
    }
  }

  #onSlotChange() {
    this.#pointLabel();
    this.#describe();
    this.#markInvalid();
  }

  // The label and the control are both slotted, so they're in the same tree and
  // a plain `for` reaches across. Only an unwired pair is touched: a consumer
  // who set `for` or `id` themselves meant it.
  #pointLabel() {
    const label = this.querySelector('label:not([slot])');
    const control = this.#control;

    if (!label || !control || label.hasAttribute('for')) {
      return;
    }

    if (!control.id) {
      control.id = uniqueId();
    }

    label.setAttribute('for', control.id);
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }
}
