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
import styles from './toggle-group.button.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-toggle-group-button': ToggleGroupButton;
  }
}

/**
 * A toggle button with no visual styles. The host is the button, so style it
 * directly.
 *
 * There's no native `<button>` inside it. Its Toggle Group moves focus between
 * its buttons with a roving `tabindex`, which has to be on the element that
 * takes focus, and a button in a shadow root can't be reached from outside it.
 * So the host is the button, with the role, `aria-pressed` and the keyboard of
 * one: Space and Enter click it.
 *
 * Its group presses and releases it, and it sets its own `:state(pressed)`
 * and `:state(disabled)`.
 *
 * @attr {boolean} [disabled=false]
 * @attr {string} [label] - Names the button when what's in it doesn't, such as when it holds only an icon.
 * @attr {boolean} [pressed=false] - Like a native checkbox's `checked`, the attribute is the default state and the property is the current one. Style `:state(pressed)` rather than `[pressed]`.
 * @attr {string} [value='']
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} - The label, plus anything else a design puts in a button
 *
 * @fires {Event} change
 * @fires {Event} input
 */
@customElement('slab-toggle-group-button')
export default class ToggleGroupButton extends LitElement {
  /**
   * Names the button when what's in it doesn't, such as when it holds only an
   * icon.
   */
  @property({ reflect: true })
  label?: string;

  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * Like a native checkbox's `checked`, the attribute is the default state and
   * the property is the current one. Style `:state(pressed)` rather than
   * `[pressed]`.
   */
  @property({ type: Boolean })
  pressed = false;

  @property({ reflect: true, useDefault: true })
  value = '';

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  override connectedCallback() {
    super.connectedCallback();

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    this.setAttribute('role', 'button');
  }

  override firstUpdated() {
    // Announced rather than left to "slotchange" because a button whose
    // definition loads after its group's upgrades in place, and an upgrade
    // isn't a change to the group's child list.
    this.dispatchEvent(new Event('private-connected', { bubbles: true }));
  }

  // Private because it's only meant to be called by Toggle Group, which
  // decides whether pressing one releases the rest.
  privateToggle() {
    this.pressed = !this.pressed;

    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  override render() {
    return html`<slot>
      <!--
        The label, plus anything else a design puts in a button
        @type {Element | string}
      -->
    </slot>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('pressed')) {
      this.setAttribute('aria-pressed', this.pressed ? 'true' : 'false');
      this.#setState('pressed', this.pressed);

      // Its group presses one at a time unless it's `multiple`, and needs to
      // know when one is pressed other than by the user.
      this.dispatchEvent(
        new Event('private-pressed-change', { bubbles: true }),
      );
    }

    if (changes.has('disabled')) {
      this.setAttribute('aria-disabled', this.disabled ? 'true' : 'false');
      this.#setState('disabled', this.disabled);

      // Its group moves the tabbable button off one that's disabled.
      this.dispatchEvent(
        new Event('private-disabled-change', { bubbles: true }),
      );
    }

    if (changes.has('label')) {
      if (this.label) {
        this.setAttribute('aria-label', this.label);
      } else {
        this.removeAttribute('aria-label');
      }
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

    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('keyup', this.#onKeyup);
  }

  #internals: ElementInternals;

  // As a native button does: Enter clicks it as it goes down, and Space as it
  // comes up.
  #onKeydown = (event: KeyboardEvent) => {
    if (event.key === ' ') {
      event.preventDefault(); // Prevent page scroll
    }

    if (event.key === 'Enter' && !event.repeat) {
      this.click();
    }
  };

  #onKeyup = (event: KeyboardEvent) => {
    if (event.key === ' ') {
      this.click();
    }
  };

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }
}
