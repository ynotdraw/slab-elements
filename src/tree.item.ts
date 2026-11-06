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
import styles from './tree.item.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-tree-item': TreeItem;
  }
}

/**
 * A Tree Item with no visual styles. The host is the tree item, so style it
 * directly, and its label and nested Tree Items through its parts.
 *
 * Tree Items nested in it are its children. Each puts itself in its parent's
 * `item` slot, inside a `[role=group]` that's `display: none` while the parent
 * is collapsed.
 *
 * It's never focused. Focus stays on its Tree, which points at the active Tree
 * Item with `aria-activedescendant`.
 *
 * Its Tree sets `:state(active)`. It sets `:state(disabled)`,
 * `:state(expanded)`, `:state(parent)` when it has children, and
 * `:state(selected)` itself.
 *
 * @attr {boolean} [disabled=false] - Disables it, as `disabled` does a native control: the user can't focus or use it, and a form control's value isn't submitted.
 * @attr {boolean} [expanded=false] - Whether its children are shown, when it has any.
 * @attr {string} [label] - Names the Tree Item in place of its text, and is what typeahead matches against.
 * @attr {boolean} [selected=false] - Like Option's, the attribute is the default state and the property is the current one. Style `:state(selected)` rather than `[selected]`.
 *
 * @slot {Element | string} - The label, plus anything else a design puts in a Tree Item
 * @slot {TreeItem} [item] - Its children. A nested Tree Item puts itself here.
 *
 * @csspart group - Its children
 * @csspart label - The label
 *
 * @readonly
 * @prop {TreeItem[]} items - Its children.
 *
 * @readonly
 * @prop {string} text - What the user reads as the Tree Item's name: its label, or its own text when it has no label.
 */
@customElement('slab-tree-item')
export default class TreeItem extends LitElement {
  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * Whether its children are shown, when it has any.
   */
  @property({ reflect: true, type: Boolean })
  expanded = false;

  /**
   * Names the Tree Item in place of its text, and is what typeahead matches
   * against.
   */
  @property({ reflect: true })
  label?: string;

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
   * Its children.
   *
   * @readonly
   */
  get items(): TreeItem[] {
    return [...this.children].filter((element) => element instanceof TreeItem);
  }

  /**
   * What the user reads as the Tree Item's name: its label, or its own text
   * when it has no label.
   *
   * @readonly
   */
  get text(): string {
    // Its own text rather than `textContent`, which would include its
    // children's.
    const text =
      typeof this.label === 'string'
        ? this.label
        : [...this.childNodes]
            .filter((node) => !(node instanceof TreeItem))
            .map(({ textContent }) => textContent)
            .join('');

    return text.replaceAll(/\s+/g, ' ').trim();
  }

  override connectedCallback() {
    super.connectedCallback();

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    this.setAttribute('role', 'treeitem');

    // Set here so the consumer doesn't have to.
    if (this.parentElement instanceof TreeItem && !this.slot) {
      this.slot = 'item';
    }
  }

  override firstUpdated() {
    // Announced rather than left to "slotchange" because a Tree Item whose
    // definition loads after its Tree's upgrades in place, and an upgrade
    // isn't a change to the Tree's child list.
    this.dispatchEvent(new Event('private-connected', { bubbles: true }));
  }

  // Private because it's only meant to be called by ItemsController, which
  // keeps one active Tree Item at a time for a Tree.
  privateSetActive(isActive: boolean) {
    this.#setState('active', isActive);
  }

  override render() {
    return html`<div part="label">
        <!-- The label -->
        <slot @slotchange=${this.#onLabelSlotChange}>
          <!--
            The label, plus anything else a design puts in a Tree Item
            @type {Element | string}
          -->
        </slot>
      </div>

      <div part="group" role=${this.items.length > 0 ? 'group' : 'none'}>
        <!-- Its children -->
        <slot name="item" @slotchange=${this.#onItemSlotChange}>
          <!--
            Its children. A nested Tree Item puts itself here.
            @type {TreeItem}
          -->
        </slot>
      </div>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('selected')) {
      this.setAttribute('aria-selected', this.selected ? 'true' : 'false');
      this.#setState('selected', this.selected);

      // Its Tree selects one at a time, and needs to know when one is selected
      // other than by the user.
      this.dispatchEvent(
        new Event('private-selected-change', { bubbles: true }),
      );
    }

    if (changes.has('disabled')) {
      this.setAttribute('aria-disabled', this.disabled ? 'true' : 'false');
      this.#setState('disabled', this.disabled);

      // Its Tree moves the active Tree Item off one that's disabled.
      this.dispatchEvent(
        new Event('private-disabled-change', { bubbles: true }),
      );
    }

    if (changes.has('expanded')) {
      this.#updateExpanded();

      // Its Tree moves the active Tree Item off a child that's been hidden.
      this.dispatchEvent(
        new Event('private-expanded-change', { bubbles: true }),
      );
    }

    if (changes.has('label')) {
      this.#updateLabel();
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

  #onItemSlotChange = () => {
    this.#updateExpanded();

    // So `role` follows whether there are children.
    this.requestUpdate();
  };

  #onLabelSlotChange = () => {
    this.#updateLabel();
  };

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  // Only a Tree Item with children is expandable, so only it has
  // `aria-expanded`.
  #updateExpanded() {
    const isParent = this.items.length > 0;

    if (isParent) {
      this.setAttribute('aria-expanded', this.expanded ? 'true' : 'false');
    } else {
      this.removeAttribute('aria-expanded');
    }

    this.#setState('expanded', isParent && this.expanded);
    this.#setState('parent', isParent);
  }

  // Named from its label or its own text, not its children's, which a name
  // computed from its content would run on into.
  #updateLabel() {
    this.setAttribute('aria-label', this.text);
  }
}
