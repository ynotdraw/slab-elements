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
import styles from './grid-list.item.styles.js';

// What can take focus in a row. A custom element whose focus goes to its
// shadow root, such as Checkbox, counts once it's defined.
const focusableSelector = [
  'a[href]',
  'area[href]',
  'audio[controls]',
  'button',
  'iframe',
  'input:not([type="hidden"])',
  'select',
  'summary',
  'textarea',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(', ');

declare global {
  interface HTMLElementTagNameMap {
    'slab-grid-list-item': GridListItem;
  }
}

/**
 * A Grid List Item with no visual styles: one row of its Grid List, a
 * `[role=row]` with a single `[role=gridcell]` around what's slotted into it,
 * such as text, a Checkbox, buttons and links.
 *
 * The row itself takes focus, and its Grid List moves focus between rows with
 * the arrow keys. Left and Right move focus between the row and the controls
 * in it. Those controls are taken out of the page's Tab order, with
 * `tabindex="-1"`, so Tab leaves the Grid List rather than stopping at each.
 *
 * It's named by its content, or by `label` when that's set, which it should
 * be when there are controls in it, so a screenreader reads "Driveway" rather
 * than "Driveway Details Remove".
 *
 * Its Grid List sets `:state(active)` on the row focus was last in, and
 * `:state(selectable)` on each row when it has `selectable` or `multiple`, so
 * a design can draw a check box. It sets `:state(disabled)` and
 * `:state(selected)` itself.
 *
 * @attr {boolean} [disabled=false] - Can't be focused or selected. The controls in it are yours to disable.
 * @attr {string} [label] - Names the row in place of its content, and is what typeahead matches against.
 * @attr {boolean} [selected=false] - Like Option's, the attribute is the default state and the property is the current one. Style `:state(selected)` rather than `[selected]`.
 *
 * @slot {Element | string} - The row's content, and any controls in it
 *
 * @csspart cell - Holds the content
 *
 * @readonly
 * @prop {HTMLElement[]} controls - What in the row can take focus, in order, other than disabled controls.
 *
 * @prop {boolean} selectable - Set by its Grid List.
 *
 * @readonly
 * @prop {string} text - What typeahead matches against: its label, or its text when it has no label.
 */
@customElement('slab-grid-list-item')
export default class GridListItem extends LitElement {
  /**
   * Can't be focused or selected. The controls in it are yours to disable.
   */
  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * Names the row in place of its content, and is what typeahead matches
   * against.
   */
  @property({ reflect: true })
  label?: string;

  /**
   * Set by its Grid List.
   */
  @property({ attribute: false, type: Boolean })
  selectable = false;

  /**
   * Like Option's, the attribute is the default state and the property is the
   * current one. Style `:state(selected)` rather than `[selected]`.
   */
  @property({ type: Boolean })
  selected = false;

  /** @internal Which version of Slab this is, for debugging. Not public API. */
  @property({ reflect: true })
  readonly version: string = slab.version;

  /**
   * What in the row can take focus, in order, other than disabled controls.
   *
   * @readonly
   */
  get controls(): HTMLElement[] {
    return this.#focusables.filter((element) => !element.matches(':disabled'));
  }

  /**
   * What typeahead matches against: its label, or its text when it has no
   * label.
   *
   * @readonly
   */
  get text(): string {
    const text = this.label ?? this.textContent;

    return text.replaceAll(/\s+/g, ' ').trim();
  }

  override connectedCallback() {
    super.connectedCallback();

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    this.setAttribute('role', 'row');

    this.#observer.observe(this, { childList: true, subtree: true });
    this.#removeControlsFromTabOrder();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  override firstUpdated() {
    // Announced rather than left to "slotchange" because a row whose
    // definition loads after its Grid List's upgrades in place, and an
    // upgrade isn't a change to the Grid List's child list.
    this.dispatchEvent(new Event('private-connected', { bubbles: true }));
  }

  // Private because it's only meant to be called by ItemsController, which
  // keeps one active row at a time for a Grid List.
  privateSetActive(isActive: boolean) {
    this.#setState('active', isActive);
  }

  override render() {
    return html`<div part="cell" role="gridcell">
      <!-- Holds the content -->
      <slot>
        <!--
          The row's content, and any controls in it
          @type {Element | string}
        -->
      </slot>
    </div>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('selected') || changes.has('selectable')) {
      // A row is only selected or not when its Grid List can select.
      if (this.selectable) {
        this.setAttribute('aria-selected', this.selected ? 'true' : 'false');
      } else {
        this.removeAttribute('aria-selected');
      }

      this.#setState('selectable', this.selectable);
      this.#setState('selected', this.selected);
    }

    if (changes.has('selected')) {
      // Its Grid List selects one at a time, unless it's `multiple`, and needs
      // to know when one is selected other than by the user.
      this.dispatchEvent(
        new Event('private-selected-change', { bubbles: true }),
      );
    }

    if (changes.has('disabled')) {
      this.setAttribute('aria-disabled', this.disabled ? 'true' : 'false');
      this.#setState('disabled', this.disabled);

      // Its Grid List moves focus and the Tab stop off one that's disabled.
      this.dispatchEvent(
        new Event('private-disabled-change', { bubbles: true }),
      );
    }

    if (changes.has('label')) {
      if (typeof this.label === 'string') {
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

  #internals = this.attachInternals();

  #observer = new MutationObserver(this.#removeControlsFromTabOrder.bind(this));

  // Every element in the row that can take focus, disabled or not.
  get #focusables(): HTMLElement[] {
    return [...this.querySelectorAll('*')].filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        (element.matches(focusableSelector) ||
          element.shadowRoot?.delegatesFocus === true),
    );
  }

  // Tab leaves the Grid List rather than stopping at each control in it, as
  // the APG's grid has it. A custom element whose focus goes to its shadow
  // root is only known to once it's defined, so it's looked at again then.
  #removeControlsFromTabOrder() {
    for (const element of this.#focusables) {
      if (element.getAttribute('tabindex') !== '-1') {
        element.tabIndex = -1;
      }
    }

    const undefinedTags = new Set(
      [...this.querySelectorAll(':not(:defined)')].map(
        ({ localName }) => localName,
      ),
    );

    for (const tag of undefinedTags) {
      void customElements.whenDefined(tag).then(() => {
        this.#removeControlsFromTabOrder();
      });
    }
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }
}
