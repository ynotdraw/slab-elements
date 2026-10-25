import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import styles from './steps.step.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-steps-step': Step;
  }
}

/**
 * A Step with no visual styles: one step of its Steps, with a number, a label
 * and an optional description.
 *
 * Its Steps numbers it and tells it whether it's complete, current or
 * upcoming. The current one has `aria-current="step"`, and a complete one
 * has its Steps' `complete-label` after its label, hidden visually, so
 * screenreaders say so. The number is hidden from screenreaders, which read
 * the list's own.
 *
 * In a `navigable` Steps, `::part(step)` is a `<button>`, and clicking it goes
 * to the Step. Set `disabled` on Steps the user can't go to yet.
 *
 * Style it through its parts and `:state(complete)`, `:state(current)`,
 * `:state(upcoming)` and, in a `navigable` Steps, `:state(navigable)`.
 *
 * @attr {boolean} [disabled=false] - Keeps the user from going to it in a `navigable` Steps.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} - The label
 * @slot {Element | string} [description] - Shown below the label
 *
 * @csspart description - Holds the description
 * @csspart indicator - The Step's number, hidden from screenreaders
 * @csspart label - Holds the label
 * @csspart status - Its Steps' complete label, hidden visually, on a complete Step
 * @csspart step - The number, label and status. A button when its Steps is navigable.
 *
 * @prop {string} completeLabel - Set by its Steps.
 * @prop {number} index - Its position, from 1. Set by its Steps.
 * @prop {boolean} navigable - Set by its Steps.
 * @prop {'complete' | 'current' | 'upcoming'} status - Set by its Steps.
 */
@customElement('slab-steps-step')
export default class Step extends LitElement {
  /**
   * Keeps the user from going to it in a `navigable` Steps.
   */
  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * Set by its Steps.
   */
  @property({ attribute: false })
  completeLabel = 'Completed';

  /**
   * Its position, from 1. Set by its Steps.
   */
  @property({ attribute: false })
  index = 1;

  /**
   * Set by its Steps.
   */
  @property({ attribute: false })
  navigable = false;

  /**
   * Set by its Steps.
   */
  @property({ attribute: false })
  status: 'complete' | 'current' | 'upcoming' = 'upcoming';

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  override firstUpdated() {
    // Announced rather than left to "slotchange" because a Step whose
    // definition loads after its Steps' upgrades in place, and an upgrade
    // isn't a change to the Steps' child list.
    this.dispatchEvent(new Event('private-connected', { bubbles: true }));
  }

  override render() {
    return html`${
        this.navigable
          ? html`<button
              aria-current=${ifDefined(this.status === 'current' ? 'step' : undefined)}
              part="step"
              type="button"
              ?disabled=${this.disabled}
              @click=${this.#onClick}
            >
              <!-- The number, label and status. A button when its Steps is navigable. -->
              ${this.#renderContent()}
            </button>`
          : html`<div
              aria-current=${ifDefined(this.status === 'current' ? 'step' : undefined)}
              part="step"
            >
              ${this.#renderContent()}
            </div>`
      }

      <div part="description">
        <!-- Holds the description -->
        <slot name="description">
          <!--
            Shown below the label
            @type {Element | string}
          -->
        </slot>
      </div>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('navigable')) {
      this.#setState('navigable', this.navigable);
    }

    if (changes.has('status')) {
      this.#setState('complete', this.status === 'complete');
      this.#setState('current', this.status === 'current');
      this.#setState('upcoming', this.status === 'upcoming');
    }
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  #internals = this.attachInternals();

  // Its Steps sets `step` and dispatches "change".
  #onClick = () => {
    this.dispatchEvent(new Event('private-select', { bubbles: true }));
  };

  #renderContent() {
    return html`<span aria-hidden="true" part="indicator">
        <!-- The Step's number, hidden from screenreaders -->
        ${this.index}
      </span>

      <span part="label">
        <!-- Holds the label -->
        <slot>
          <!--
            The label
            @type {Element | string}
          -->
        </slot>
      </span>

      ${
        this.status === 'complete'
          ? html`<span part="status">
              <!-- Its Steps' complete label, hidden visually, on a complete Step -->
              ${this.completeLabel}
            </span>`
          : ''
      }`;
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }
}
