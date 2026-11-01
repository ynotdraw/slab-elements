import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
} from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import required from './library/required.js';
import styles from './progress.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-progress': Progress;
  }
}

/**
 * A progress bar with no visual styles, around a native `<progress>`, so it's
 * a progressbar to the platform with its value and maximum, as one is.
 *
 * With no `value`, it's indeterminate: the task is under way, but how far
 * along isn't known. That's what a spinner shows, so there's no Spinner.
 *
 * The label and the `<progress>` are both in the shadow root, so a plain `for`
 * reference names it.
 *
 * Screenreaders read how far along it is as a percentage. Set `formatValue` to
 * a function of `value` that says it another way, such as "3 of 10 files",
 * which becomes the `<progress>`'s `aria-valuetext`. It isn't called while
 * it's indeterminate.
 *
 * Style it through its parts and through `:state(indeterminate)`.
 *
 * @attr {string} label
 * @attr {boolean} [hide-label=false]
 * @attr {number} [max] - 1 when unset, as on a native `<progress>`.
 * @attr {number} [value] - How much of the task is done, from 0 to `max`. Indeterminate when unset, as on a native `<progress>`.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @csspart label - The label
 * @csspart progress
 *
 * @prop {(value: number) => string | undefined} formatValue - What screenreaders read for the value, such as "3 of 10 files" rather than "30%". A percentage when unset.
 */
@customElement('slab-progress')
export default class Progress extends LitElement {
  @property({ reflect: true })
  @required
  label?: string;

  /**
   * What screenreaders read for the value, such as "3 of 10 files" rather
   * than "30%". A percentage when unset.
   */
  @property({ attribute: false })
  formatValue?: (value: number) => string;

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  /**
   * 1 when unset, as on a native `<progress>`.
   */
  @property({ reflect: true, type: Number })
  max?: number;

  /**
   * How much of the task is done, from 0 to `max`. Indeterminate when unset,
   * as on a native `<progress>`.
   */
  @property({ reflect: true, type: Number })
  value?: number;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  override render() {
    // There's no `role` or `aria-value*` here but `aria-valuetext`. A
    // `<progress>` is a progressbar to the platform already, with its value
    // and maximum, and without them when it has no value.
    return html`<label for="progress" part="label">
        <!-- The label -->
        ${this.label}
      </label>

      <progress
        aria-valuetext=${ifDefined(
          this.value === undefined || this.value === null
            ? undefined
            : this.formatValue?.(this.value),
        )}
        id="progress"
        max=${ifDefined(this.max ?? undefined)}
        part="progress"
        value=${ifDefined(this.value ?? undefined)}
      ></progress>`;
  }

  // On every update rather than only when `value` changes, because an unset
  // `value` never changes, and starts out indeterminate.
  override updated() {
    // Removing the attribute sets `value` to `null` rather than back to
    // `undefined`, so either counts as unset.
    this.#setState(
      'indeterminate',
      this.value === undefined || this.value === null,
    );
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
