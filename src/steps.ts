import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
} from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import StringsController from './library/strings.js';
import ListItemSlots from './library/list-item-slots.js';
import required from './library/required.js';
import Step from './steps.step.js';
import styles from './steps.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-steps': Steps;
  }
}

/**
 * Steps with no visual styles: where the user is in a task of several steps,
 * such as a checkout or a setup wizard, as an `<ol>` of Steps.
 *
 * Each Step gets an `<li>` of its own, as each link in a Breadcrumb does. The
 * Steps before `step` are complete, the one at it is current and has
 * `aria-current="step"`, and the rest are upcoming. Past the last Step, all of
 * them are complete. A complete Step says so to screenreaders with
 * `complete-label`, which is hidden visually.
 *
 * Steps shows where the user is, not the steps' content. Show the content for
 * `step` yourself, and call `next()` and `previous()` from your own buttons.
 *
 * With `navigable`, each Step is a `<button>`, and clicking one sets `step`
 * and dispatches "change". Disable the Steps the user can't go to yet, such as
 * those after the current one in a form that has to be filled in order.
 * Without it, nothing in Steps is interactive.
 *
 * Style it through its parts, and each Step through its parts and
 * `:state(complete)`, `:state(current)` and `:state(upcoming)`.
 *
 * @attr {string} label - Names the list.
 * @attr {string} [complete-label] - Read by screenreaders after each complete Step's label. "Completed" in English when unset.
 * @attr {boolean} [navigable=false] - Makes each Step a button that goes to it.
 * @attr {number} [step=1] - The current Step, from 1. The Steps before it are complete.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Step} - The Steps, in order
 *
 * @csspart item - Each Step's list item
 * @csspart list - The Steps
 *
 * @fires {Event} change
 *
 * @readonly
 * @prop {Step[]} steps
 *
 * @method next - Goes to the next Step, or past the last one, where every Step is complete. It doesn't dispatch "change", which is only for the user's clicks.
 * @method previous - Goes to the previous Step, stopping at the first. It doesn't dispatch "change", which is only for the user's clicks.
 */
@customElement('slab-steps')
export default class Steps extends LitElement {
  /**
   * Names the list.
   */
  @property({ reflect: true })
  @required
  label?: string;

  /**
   * Read by screenreaders after each complete Step's label. "Completed" in
   * English when unset.
   */
  @property({ attribute: 'complete-label', reflect: true })
  completeLabel?: string;

  /**
   * Makes each Step a button that goes to it.
   */
  @property({ reflect: true, type: Boolean })
  navigable = false;

  /**
   * The current Step, from 1. The Steps before it are complete.
   */
  @property({ reflect: true, type: Number, useDefault: true })
  step = 1;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  // Direct children rather than a query, so a renamed subclass still counts
  // and a Step inside another component doesn't.
  get steps(): Step[] {
    return [...this.children].filter((element) => element instanceof Step);
  }

  /**
   * Goes to the next Step, or past the last one, where every Step is
   * complete. It doesn't dispatch "change", which is only for the user's
   * clicks.
   */
  next(): void {
    this.step = Math.min(this.step + 1, this.steps.length + 1);
  }

  /**
   * Goes to the previous Step, stopping at the first. It doesn't dispatch
   * "change", which is only for the user's clicks.
   */
  previous(): void {
    this.step = Math.max(this.step - 1, 1);
  }

  override render() {
    // Each named slot hears its Step being moved or replaced, which changes
    // the Steps' numbers but neither the slots nor the child count.
    return html`<ol aria-label=${ifDefined(this.label)} part="list">
        <!-- The Steps -->
        ${repeat(
          this.#listItemSlots.names,
          (name) => name,
          (name) =>
            html`<li part="item">
              <!-- Each Step's list item -->
              <slot name=${name} @slotchange=${this.#onSlotChange}>
                <!--
                  One of the Steps, put here by Steps
                  @type {Step}
                  @ignore
                -->
              </slot>
            </li>`,
        )}
      </ol>

      <!-- Hears Steps added without a slot, so they can be given one -->
      <slot @slotchange=${this.#onDefaultSlotChange}>
        <!--
          The Steps, in order
          @type {Step}
        -->
      </slot>`;
  }

  override updated() {
    this.#sync();
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

    this.addEventListener('private-connected', this.#onConnected);
    this.addEventListener('private-select', this.#onSelect);
  }

  #listItemSlots = new ListItemSlots(this);

  #strings = new StringsController(this);

  // A Step whose definition loads after its Steps' upgrades in place, and an
  // upgrade isn't a change to Steps' child list.
  #onConnected = (event: Event) => {
    if (this.#isOwn(event)) {
      this.#sync();
    }
  };

  #onDefaultSlotChange = () => {
    this.#listItemSlots.assign();
    this.#sync();
  };

  // Only a Step in a navigable Steps has a button to click, and so dispatches
  // "private-select".
  #onSelect = (event: Event) => {
    if (!this.#isOwn(event)) {
      return;
    }

    const step = this.steps.indexOf(event.target as Step) + 1;

    if (step !== this.step) {
      this.step = step;

      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
  };

  #onSlotChange = () => {
    this.#sync();
  };

  #isOwn(event: Event) {
    return event.target instanceof Step && event.target.parentElement === this;
  }

  // Numbers each Step and tells it whether it's complete, current or
  // upcoming. Run after every update, and whenever a Step is added, removed or
  // moved.
  #sync() {
    for (const [index, step] of this.steps.entries()) {
      const number = index + 1;

      step.completeLabel =
        this.completeLabel ?? this.#strings.value.stepsComplete;

      step.index = number;
      step.navigable = this.navigable;

      step.status =
        number < this.step
          ? 'complete'
          : number === this.step
            ? 'current'
            : 'upcoming';
    }
  }
}
