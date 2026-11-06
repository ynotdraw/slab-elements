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
import styles from './option.styles.js';
import { type Rendering } from './library/virtualizer.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-option': Option;
  }
}

/**
 * An Option with no visual styles. The host is the option, so style it
 * directly.
 *
 * It's never focused. Focus stays on its Listbox, which points at the active
 * Option with `aria-activedescendant`, so a Select or a Combobox can keep focus
 * where it is while the user moves through the Options.
 *
 * Its Listbox sets `:state(active)`. It sets `:state(disabled)`, which is also
 * set while its Listbox is disabled, and `:state(selected)` itself.
 *
 * @attr {boolean} [disabled=false] - Disables it, as `disabled` does a native control: the user can't focus or use it, and a form control's value isn't submitted.
 * @attr {string} [label] - Names the Option in place of its text, and is what typeahead matches against.
 * @attr {boolean} [selected=false] - Like a native option, the attribute is the default state and the property is the current one. Style `:state(selected)` rather than `[selected]`.
 * @attr {string} [value=''] - Its label, or its text when it has no label, when not set. The same as a native option.
 *
 * @slot {Element | string} - The label, plus anything else a design puts in an Option
 *
 * @readonly
 * @prop {string} text - What the user reads as the Option's name: its label, or its text when it has no label.
 */
@customElement('slab-option')
export default class Option extends LitElement {
  /**
   * Names the Option in place of its text, and is what typeahead matches
   * against.
   */
  @property({ reflect: true })
  label?: string;

  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * Like a native option, the attribute is the default state and the property
   * is the current one. Style `:state(selected)` rather than `[selected]`.
   */
  @property({ type: Boolean })
  selected = false;

  /**
   * Its label, or its text when it has no label, when not set. The same as a
   * native option.
   *
   * @default ''
   */
  @property()
  get value(): string {
    return this.#value ?? this.text;
  }

  set value(value: string | null | undefined) {
    this.#value = value ?? undefined;
  }

  /** @internal Which version of Slab this is, for debugging. Not public API. */
  @property({ reflect: true })
  readonly version: string = slab.version;

  /**
   * What the user reads as the Option's name: its label, or its text when it
   * has no label.
   *
   * @readonly
   */
  get text(): string {
    const text = typeof this.label === 'string' ? this.label : this.textContent;

    return text.replaceAll(/\s+/g, ' ').trim();
  }

  override connectedCallback() {
    super.connectedCallback();

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    this.setAttribute('role', 'option');
  }

  override firstUpdated() {
    // Announced rather than left to "slotchange" because an Option whose
    // definition loads after its Listbox's upgrades in place, and an upgrade
    // isn't a change to the Listbox's child list.
    this.dispatchEvent(new Event('private-connected', { bubbles: true }));
  }

  // Private because it's only meant to be called by OptionsController, which
  // keeps one active Option at a time for a Listbox, Select or Combobox.
  privateSetActive(isActive: boolean) {
    this.#setState('active', isActive);
  }

  // Private for the same reason. An Option reads as disabled while its Listbox
  // is, without the Listbox overwriting the Option's own `disabled`, which
  // would be lost when the Listbox is enabled again.
  privateSetListboxDisabled(isDisabled: boolean) {
    // Called for every Option whenever they change, so it's skipped when
    // there's nothing to do. Thousands of Options would otherwise each be
    // written to thousands of times as they connect.
    if (isDisabled === this.#isListboxDisabled && this.hasUpdated) {
      return;
    }

    this.#isListboxDisabled = isDisabled;
    this.#updateDisabled();
  }

  // Private because it's only meant to be called by the Virtualizer of a
  // Listbox or Combobox with `virtual`. Its position among the Options that
  // are shown, which screenreaders would otherwise count from the few that
  // are rendered.
  privateSetPosition(position: { index: number; size: number } | null) {
    if (position) {
      this.setAttribute('aria-posinset', String(position.index));
      this.setAttribute('aria-setsize', String(position.size));
    } else {
      this.removeAttribute('aria-posinset');
      this.removeAttribute('aria-setsize');
    }
  }

  // Private for the same reason. Whether it's laid out, which `virtual`
  // reserves for the Options in or near view.
  privateSetRendering(rendering: Rendering) {
    this.#setState('private-unrendered', rendering === 'unrendered');
    this.#setState('private-offscreen', rendering === 'offscreen');
  }

  override render() {
    return html`<slot>
      <!--
        The label, plus anything else a design puts in an Option
        @type {Element | string}
      -->
    </slot>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('selected')) {
      this.setAttribute('aria-selected', this.selected ? 'true' : 'false');
      this.#setState('selected', this.selected);

      // The Listbox deselects the others when it allows only one, and needs
      // to know when one is selected other than by the user.
      this.dispatchEvent(
        new Event('private-selected-change', { bubbles: true }),
      );
    }

    if (changes.has('disabled')) {
      this.#updateDisabled();

      // The Listbox leaves disabled Options out of its value and moves the
      // active one along when it's disabled.
      this.dispatchEvent(
        new Event('private-disabled-change', { bubbles: true }),
      );
    }

    if (changes.has('label')) {
      // Removing the attribute sets `label` to `null` rather than back to
      // `undefined`, so it's the type that's checked.
      if (typeof this.label === 'string') {
        this.setAttribute('aria-label', this.label);
      } else {
        this.removeAttribute('aria-label');
      }
    }

    // A change to `label` can change the value too, when there isn't one.
    if (changes.has('value') || changes.has('label')) {
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

  #isListboxDisabled = false;

  #value?: string;

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  #updateDisabled() {
    const isDisabled = this.disabled || this.#isListboxDisabled;

    this.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
    this.#setState('disabled', isDisabled);
  }
}
