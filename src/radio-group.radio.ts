import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import slab from './library/version.js';
import customElement from './library/custom-element.js';
import required from './library/required.js';
import styles from './radio-group.radio.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-radio-group-radio': Radio;
  }
}

/**
 * A Radio with no visual styles. The host is the radio, so style it directly.
 *
 * There's no native radio inside it. Native radios only group when they share
 * a tree and a name, and each of these is in its own shadow root, so the group
 * does the grouping: it moves focus, checks one at a time, and owns the value.
 *
 * Radio Group sets its `:state(checked)` and `:state(disabled)`.
 *
 * @attr {string} label - Names it. It's the accessible name, and the visible label where there is one.
 * @attr {boolean} [checked=false] - Like a native radio, the attribute is the default state and the property is the current one. Style `:state(checked)` rather than `[checked]`.
 * @attr {boolean} [disabled=false] - Disables it, as `disabled` does a native control: the user can't focus or use it, and a form control's value isn't submitted.
 * @attr {string} [value=''] - What its Radio Group submits while it's checked.
 *
 * @slot {Element | string} - The label, plus anything else a design puts in a Radio
 *
 * @cssstate checked - While it's checked.
 * @cssstate disabled - While it's disabled.
 *
 * @fires {Event} change - When the user changes its value, as a native control's does. Setting it from code doesn't dispatch it.
 * @fires {Event} input - As the user changes its value, as a native control's does. Setting it from code doesn't dispatch it.
 */
@customElement('slab-radio-group-radio')
export default class Radio extends LitElement {
  @property({ reflect: true })
  @required
  label?: string;

  /**
   * Like a native radio, the attribute is the default state and the property
   * is the current one. Style `:state(checked)` rather than `[checked]`.
   */
  @property({ type: Boolean })
  checked = false;

  @property({ reflect: true, type: Boolean })
  disabled = false;

  @property({ reflect: true, useDefault: true })
  value = '';

  /** @internal Which version of Slab this is, for debugging. Not public API. */
  @property({ reflect: true })
  readonly version: string = slab.version;

  override connectedCallback() {
    super.connectedCallback();

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    this.setAttribute('role', 'radio');
  }

  override firstUpdated() {
    // Announced rather than left to "slotchange" because a Radio whose
    // definition loads after its Group's upgrades in place, and an upgrade
    // isn't a change to the Group's child list.
    this.dispatchEvent(new Event('private-connected', { bubbles: true }));
  }

  // Private because it's only meant to be called by Radio Group, which checks
  // one Radio at a time.
  privateCheck() {
    if (this.checked || this.disabled) {
      return;
    }

    this.checked = true;

    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  override render() {
    return html`<slot>
      <!--
        The label, plus anything else a design puts in a Radio
        @type {Element | string}
      -->
    </slot>`;
  }

  // Radio Group derives its value from its Radios. It's told here as well as
  // after the update, so a change made from code is in its value and form
  // data straight away, as a native radio's would be.
  override requestUpdate(
    ...parameters: Parameters<LitElement['requestUpdate']>
  ) {
    super.requestUpdate(...parameters);

    const [name] = parameters;

    if (!this.hasUpdated) {
      return;
    }

    if (name === 'checked') {
      this.dispatchEvent(
        new Event('private-checked-change', { bubbles: true }),
      );
    }

    if (name === 'value') {
      this.dispatchEvent(new Event('private-value-change', { bubbles: true }));
    }
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('checked') || changes.has('disabled')) {
      const isChecked = this.checked && !this.disabled;

      this.setAttribute('aria-checked', isChecked ? 'true' : 'false');
      this.#setState('checked', this.checked);
    }

    if (changes.has('disabled')) {
      this.setAttribute('aria-disabled', this.disabled ? 'true' : 'false');
      this.#setState('disabled', this.disabled);

      // The Group makes Radios tabbable and untabbable, and needs to know when
      // one disables itself so it can move that along.
      this.dispatchEvent(
        new Event('private-disabled-change', { bubbles: true }),
      );
    }

    // Later changes are announced as they're set, in `requestUpdate()`.
    if (changes.has('checked') && changes.get('checked') === undefined) {
      this.dispatchEvent(
        new Event('private-checked-change', { bubbles: true }),
      );
    }

    if (changes.has('label') && this.label) {
      this.setAttribute('aria-label', this.label);
    }

    if (changes.has('value') && changes.get('value') === undefined) {
      this.dispatchEvent(new Event('private-value-change', { bubbles: true }));
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

  #internals: ElementInternals;

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }
}
