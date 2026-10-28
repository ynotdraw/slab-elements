import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref } from 'lit/directives/ref.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import assertSlot from './library/assert-slot.js';
import ItemsController from './library/items-controller.js';
import required from './library/required.js';
import TreeItem from './tree.item.js';
import styles from './tree.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-tree': Tree;
  }
}

/**
 * A tree with no visual styles: a `[role=tree]` of Tree Items, which nest, to
 * select one or, when `multiple` is set, more from.
 *
 * It's the APG's tree view. Focus stays on the tree, and its
 * `aria-activedescendant` points at the active Tree Item, which is the first
 * one or the selected one until the user moves. Down and Up move through the
 * Tree Items that can be seen, skipping disabled ones, and Home and End go to
 * the first and last. Right expands a collapsed Tree Item, or moves to the
 * first child of an expanded one. Left collapses an expanded Tree Item, or
 * moves to the parent of one that isn't. `*` expands every Tree Item with
 * children at the active one's level. Typing moves to the next Tree Item whose
 * label starts with what was typed. Enter, Space and a click select the active
 * Tree Item, and a click expands or collapses one that has children. In a
 * right-to-left tree, Left expands and Right collapses.
 *
 * When `multiple` is set, Enter, Space and a click toggle the Tree Item
 * instead, and Shift with the Down or Up arrow moves and toggles. Shift with
 * Space selects every Tree Item that can be seen from the one last selected to
 * the active one, and Control or Command with Shift and Home or End selects
 * every one from the active one to the first or last, moving there. Control or
 * Command with A selects every enabled Tree Item, at every depth, or none when
 * they all are already. These are the APG's keys for a multi-select tree.
 *
 * Style it through its part, and each Tree Item through its own parts and
 * states.
 *
 * @attr {string} label - Names the tree.
 * @attr {boolean} [multiple=false]
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {TreeItem}
 *
 * @csspart tree - The Tree Items
 *
 * @fires {Event} change
 *
 * @readonly
 * @prop {TreeItem[]} items - Every Tree Item, at every depth, in order.
 *
 * @readonly
 * @prop {TreeItem | null} selectedItem
 *
 * @readonly
 * @prop {TreeItem[]} selectedItems - Every selected Tree Item, at every depth, in order.
 */
@customElement('slab-tree')
export default class Tree extends LitElement {
  /**
   * Names the tree.
   */
  @property({ reflect: true })
  @required
  label?: string;

  @property({ reflect: true, type: Boolean })
  multiple = false;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  /**
   * Every Tree Item, at every depth, in order.
   */
  get items(): TreeItem[] {
    return this.#flatten(this.#topLevelItems, () => true);
  }

  get selectedItem(): TreeItem | null {
    return this.selectedItems.at(0) ?? null;
  }

  /**
   * Every selected Tree Item, at every depth, in order.
   */
  get selectedItems(): TreeItem[] {
    return this.items.filter(({ selected }) => selected);
  }

  override focus(options?: FocusOptions) {
    this.#treeElementRef.value?.focus(options);
  }

  override render() {
    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    //
    // The tree's clicks are its Tree Items', and its keyboard is
    // `#onKeydown`.
    return html`<div
      aria-label=${ifDefined(this.label)}
      aria-multiselectable=${this.multiple ? 'true' : 'false'}
      part="tree"
      role="tree"
      tabindex="0"
      @click=${this.#onClick}
      @focus=${this.#onFocus}
      @keydown=${this.#onKeydown}
      ${ref(this.#treeElementRef)}
    >
      <!-- The Tree Items -->
      <slot ${assertSlot([TreeItem])} ${ref(this.#slotElementRef)}>
        <!-- @type {TreeItem} -->
      </slot>
    </div>`;
  }

  override updated(changes: PropertyValues<this>) {
    // Down to one when it stops being `multiple`: the last selected, the one a
    // native `<select>` keeps.
    if (changes.get('multiple') === true && !this.multiple) {
      const last = this.selectedItems.at(-1);

      if (last) {
        this.#selectOnly(last);
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

    this.addEventListener('private-expanded-change', this.#onExpandedChange);
    this.addEventListener('private-selected-change', this.#onSelectedChange);
  }

  // The Tree Item the user last selected, where Shift with Space selects from.
  #anchor?: TreeItem;

  // Every Tree Item that can be seen: the top-level ones, and the children of
  // each expanded one.
  #items = new ItemsController(this, {
    activeDescendantElement: () => this.#treeElementRef.value,
    itemClass: TreeItem,
    items: () => this.#flatten(this.#topLevelItems, ({ expanded }) => expanded),
    onChange: () => {
      this.requestUpdate();
    },
    slot: () => this.#slotElementRef.value,
  });

  #slotElementRef = createRef<HTMLSlotElement>();

  #treeElementRef = createRef<HTMLDivElement>();

  // Assigned elements rather than children, so a Tree Item nested in another
  // component doesn't count.
  get #topLevelItems() {
    return (this.#slotElementRef.value?.assignedElements() ?? []).filter(
      (element) => element instanceof TreeItem,
    );
  }

  #onClick = (event: MouseEvent) => {
    // The innermost, since a click on a child is also a click on its parents.
    const item = event
      .composedPath()
      .find((target): target is TreeItem => target instanceof TreeItem);

    if (!item || item.disabled || !this.items.includes(item)) {
      return;
    }

    this.#items.activeItem = item;

    if (this.multiple) {
      this.#toggle(item);
    } else {
      this.#select(item);
    }

    if (item.items.length > 0) {
      item.expanded = !item.expanded;
    }
  };

  // A collapsed Tree Item's children can't be seen, so the active one moves up
  // to it rather than being lost.
  #onExpandedChange = (event: Event) => {
    const active = this.#items.activeItem;

    if (
      event.target instanceof TreeItem &&
      !event.target.expanded &&
      active &&
      active !== event.target &&
      event.target.contains(active)
    ) {
      this.#items.activeItem = event.target;
    }

    this.requestUpdate();
  };

  // Where the user left off, or else the selected Tree Item, or else the
  // first.
  #onFocus = () => {
    if (!this.#items.activeItem) {
      const selected = this.selectedItem;

      this.#items.activeItem =
        selected && this.#items.navigableItems.includes(selected)
          ? selected
          : (this.#items.navigableItems.at(0) ?? null);
    }
  };

  #onKeydown = (event: KeyboardEvent) => {
    const items = this.#items;
    const active = items.activeItem;
    const isControl = event.ctrlKey || event.metaKey;

    if (this.multiple && isControl && !event.altKey) {
      if (!event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault(); // So the page's text isn't selected
        this.#selectAll();

        return;
      }

      if (event.shiftKey && (event.key === 'Home' || event.key === 'End')) {
        event.preventDefault(); // Prevent page scroll

        const from = active;
        const to = event.key === 'Home' ? items.first() : items.last();

        if (from && to) {
          this.#selectRange(from, to);
        }

        return;
      }
    }

    // Modifiers are left alone, other than the ones above, so the browser's
    // and the operating system's shortcuts still work.
    if (event.altKey || isControl) {
      return;
    }

    if (event.key === '*') {
      event.preventDefault(); // So it isn't taken for typeahead

      if (active) {
        this.#expandSiblings(active);
      }

      return;
    }

    // Space is part of what's being typed while there is something, so "Read
    // me" can be typed out, rather than selecting part-way.
    const isCharacter = [...event.key].length === 1;

    if (isCharacter && (event.key !== ' ' || items.isTyping)) {
      event.preventDefault(); // Prevent page scroll on Space
      items.typeahead(event.key);

      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevent page scroll and form submission

      if (!active) {
        return;
      }

      if (this.multiple && event.shiftKey && event.key === ' ') {
        this.#selectRange(this.#anchor ?? active, active);
      } else if (this.multiple) {
        this.#toggle(active);
      } else {
        this.#select(active);
      }

      return;
    }

    // Right expands and Left collapses, swapped where the tree is right to
    // left, so the key always points the way the children are indented.
    const isRtl = getComputedStyle(this).direction === 'rtl';
    const expandKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const collapseKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

    if (event.key === expandKey && active) {
      event.preventDefault(); // Prevent page scroll

      if (active.items.length > 0 && !active.expanded) {
        active.expanded = true;
      } else if (active.expanded) {
        items.activeItem =
          active.items.find((item) => !item.disabled) ?? active;
      }

      return;
    }

    if (event.key === collapseKey && active) {
      event.preventDefault(); // Prevent page scroll

      if (active.expanded) {
        active.expanded = false;
      } else if (active.parentElement instanceof TreeItem) {
        items.activeItem = active.parentElement;
      }

      return;
    }

    const move = {
      ArrowDown: () => items.next(),
      ArrowUp: () => (active ? items.previous() : items.first()),
      End: () => items.last(),
      Home: () => items.first(),
    }[event.key];

    if (move) {
      event.preventDefault(); // Prevent page scroll

      const next = move();

      // Moving and toggling, as in a Listbox.
      if (
        next &&
        next !== active &&
        this.multiple &&
        event.shiftKey &&
        (event.key === 'ArrowDown' || event.key === 'ArrowUp')
      ) {
        this.#toggle(next);
      }
    }
  };

  #onSelectedChange = (event: Event) => {
    if (
      !this.multiple &&
      event.target instanceof TreeItem &&
      event.target.selected &&
      this.items.includes(event.target)
    ) {
      this.#selectOnly(event.target);
    }
  };

  #dispatchChange() {
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  // The Tree Items at its level, it included: its parent's children, or the
  // top-level ones.
  #expandSiblings(item: TreeItem) {
    const siblings =
      item.parentElement instanceof TreeItem
        ? item.parentElement.items
        : this.#topLevelItems;

    for (const sibling of siblings) {
      if (sibling.items.length > 0) {
        sibling.expanded = true;
      }
    }
  }

  // Depth-first, descending into the Tree Items `isDescended` says to.
  #flatten(
    items: TreeItem[],
    isDescended: (item: TreeItem) => boolean,
  ): TreeItem[] {
    return items.flatMap((item) => [
      item,
      ...(isDescended(item) ? this.#flatten(item.items, isDescended) : []),
    ]);
  }

  // What the user's Enter, Space and clicks do. "change" is only for the
  // user's selections.
  #select(item: TreeItem) {
    this.#anchor = item;

    if (item.selected) {
      return;
    }

    this.#selectOnly(item);
    this.#dispatchChange();
  }

  // Every enabled Tree Item, at every depth, or none when they all are.
  #selectAll() {
    const enabled = this.items.filter(({ disabled }) => !disabled);
    const isAllSelected = enabled.every(({ selected }) => selected);

    for (const item of enabled) {
      item.selected = !isAllSelected;
    }

    this.#dispatchChange();
  }

  // One at a time, at every depth.
  #selectOnly(selected: TreeItem) {
    selected.selected = true;

    for (const item of this.items) {
      if (item !== selected) {
        item.selected = false;
      }
    }
  }

  // Every Tree Item that can be seen from one to the other, both included,
  // adding to what's selected. From only `to` when `from` can't be seen.
  #selectRange(from: TreeItem, to: TreeItem) {
    const navigable = this.#items.navigableItems;
    const end = navigable.indexOf(to);
    const start = navigable.includes(from) ? navigable.indexOf(from) : end;

    const range = navigable.slice(
      Math.min(start, end),
      Math.max(start, end) + 1,
    );

    const isChange = range.some(({ selected }) => !selected);

    for (const item of range) {
      item.selected = true;
    }

    if (isChange) {
      this.#dispatchChange();
    }
  }

  // What the user's Enter, Space and clicks do when `multiple`.
  #toggle(item: TreeItem) {
    item.selected = !item.selected;

    if (item.selected) {
      this.#anchor = item;
    }

    this.#dispatchChange();
  }
}
