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
import GridListItem from './grid-list.item.js';
import ItemsController from './library/items-controller.js';
import required from './library/required.js';
import styles from './grid-list.styles.js';

// Controls whose arrow keys, Home and End move a caret or change a value, so
// they're theirs.
const editingSelector =
  'input:not([type="button"], [type="checkbox"], [type="color"], [type="file"], [type="image"], [type="radio"], [type="reset"], [type="submit"]), select, textarea, [contenteditable]:not([contenteditable="false"])';

declare global {
  interface HTMLElementTagNameMap {
    'slab-grid-list': GridList;
  }
}

/**
 * A Grid List with no visual styles: a `[role=grid]` of rows, Grid List Items,
 * that can hold controls of their own, such as a Checkbox, buttons and links,
 * and that can be selected.
 *
 * It's a one-column APG grid, like React Aria's GridList. Tab reaches it once,
 * on the row focus was last in, or else on the first selected row, or else on
 * the first. Down and Up move focus between rows, skipping disabled ones, and
 * Home and End, with or without Control or Command, go to the first and last.
 * Right moves from a row to the first control in it, then to each control
 * after that, and back to the row from the last. Left goes the other way. In a
 * right-to-left Grid List, Left and Right swap. Escape moves from a control
 * back to its row. Typing moves to the next row whose text starts with what's
 * typed. A control that edits text, such as a text `<input>`, keeps its arrow
 * keys, Home and End, and so does one that handles a key itself and cancels
 * it.
 *
 * Rows aren't selected unless `selection-mode` is `"single"` or `"multiple"`.
 * Then Space, Enter and a click on a row, but not on a control in it, select
 * the row, or toggle it when `"multiple"`. With `"multiple"`, Shift with Down
 * or Up moves and toggles, Shift with Space selects every row from the one
 * last selected to the focused one, and Control or Command with Shift and Home
 * or End selects every one from the focused row to the first or last, moving
 * there. Control or Command with A selects every enabled row, or none when
 * they all are already. These are the APG's keys for a multi-select grid.
 *
 * Put controls in it that take focus themselves, such as `<button>`s, links
 * and Slab's own Checkbox. Each row takes them out of the page's Tab order, so
 * Tab leaves the Grid List rather than stopping at each.
 *
 * Style it through its part, and each row through its part and states.
 *
 * @attr {string} label - Names the grid list.
 * @attr {'multiple'|'none'|'single'} [selection-mode='none'] - Whether rows can be selected, and how many at once.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {GridListItem}
 *
 * @csspart grid - The rows
 *
 * @fires {Event} change
 *
 * @readonly
 * @prop {GridListItem[]} items
 *
 * @readonly
 * @prop {GridListItem | null} selectedItem
 *
 * @readonly
 * @prop {GridListItem[]} selectedItems
 */
@customElement('slab-grid-list')
export default class GridList extends LitElement {
  /**
   * Names the grid list.
   */
  @property({ reflect: true })
  @required
  label?: string;

  /**
   * Whether rows can be selected, and how many at once.
   */
  @property({ attribute: 'selection-mode', reflect: true, useDefault: true })
  selectionMode: 'multiple' | 'none' | 'single' = 'none';

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  get items(): GridListItem[] {
    return this.#items.items;
  }

  get selectedItem(): GridListItem | null {
    return this.selectedItems.at(0) ?? null;
  }

  get selectedItems(): GridListItem[] {
    return this.items.filter(({ selected }) => selected);
  }

  override focus(options?: FocusOptions) {
    this.#tabbableItem?.focus(options);
  }

  override render() {
    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    return html`<div
      aria-label=${ifDefined(this.label)}
      aria-multiselectable=${ifDefined(
        this.selectionMode === 'multiple' ? 'true' : undefined,
      )}
      part="grid"
      role="grid"
      @click=${this.#onClick}
      @focusin=${this.#onFocusIn}
      @keydown=${this.#onKeydown}
    >
      <!-- The rows -->
      <slot ${assertSlot([GridListItem])} ${ref(this.#slotElementRef)}>
        <!-- @type {GridListItem} -->
      </slot>
    </div>`;
  }

  override updated(changes: PropertyValues<this>) {
    // Down to one when it stops being `multiple`: the last selected, the one a
    // native `<select>` keeps.
    if (
      changes.get('selectionMode') === 'multiple' &&
      this.selectionMode === 'single'
    ) {
      const last = this.selectedItems.at(-1);

      if (last) {
        this.#selectOnly(last);
      }
    }

    this.#updateItems();
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

    this.addEventListener('private-selected-change', this.#onSelectedChange);
  }

  // The row the user last selected, where Shift with Space selects from.
  #anchor?: GridListItem;

  // The active row is the one focus was last in. It's focused rather than
  // pointed at, so there's no `aria-activedescendant`.
  #items = new ItemsController(this, {
    itemClass: GridListItem,
    onChange: () => {
      this.requestUpdate();
    },
    slot: () => this.#slotElementRef.value,
  });

  #slotElementRef = createRef<HTMLSlotElement>();

  get #isSelectable() {
    return this.selectionMode !== 'none';
  }

  // Where Tab lands: the active row, or else the first selected one, or else
  // the first.
  get #tabbableItem() {
    const navigable = this.#items.navigableItems;

    return (
      this.#items.activeItem ??
      navigable.find(({ selected }) => selected) ??
      navigable.at(0)
    );
  }

  #onClick = (event: MouseEvent) => {
    if (!this.#isSelectable) {
      return;
    }

    const path = event.composedPath();
    const item = this.#itemOf(event.target);

    // A click on a control in a row is the control's.
    const isOnControl = item?.controls.some((control) => {
      return path.includes(control);
    });

    if (!item || item.disabled || isOnControl) {
      return;
    }

    if (this.selectionMode === 'multiple') {
      this.#toggle(item);
    } else {
      this.#select(item);
    }
  };

  // Remembered as the active row, so Tab comes back to it.
  #onFocusIn = (event: FocusEvent) => {
    const item = this.#itemOf(event.target);

    if (item && !item.disabled) {
      this.#items.activeItem = item;
      this.#updateItems();
    }
  };

  #onKeydown = (event: KeyboardEvent) => {
    const item = this.#itemOf(event.target);

    // A disabled row's controls are left to themselves.
    if (!item || item.disabled || event.defaultPrevented) {
      return;
    }

    const isOnRow = event.target === item;
    const isControl = event.ctrlKey || event.metaKey;

    // The element inside a custom element's shadow root, such as a Text
    // Field's `<input>`, rather than the custom element.
    const [origin] = event.composedPath();

    const isEditingText =
      !isOnRow && origin instanceof Element && origin.matches(editingSelector);

    // Shift+Tab from a control would otherwise land on its row, which is
    // before it and in the Tab order. From the row, it leaves the Grid List,
    // as Tab from a control does.
    if (event.key === 'Tab' && event.shiftKey && !isOnRow) {
      item.focus();

      return;
    }

    // Escape leaves a control, even one that edits text, for its row, the
    // APG grid's way out of a control that keeps the arrow keys.
    if (event.key === 'Escape' && !isOnRow) {
      event.preventDefault(); // So a Dialog it's in stays open
      item.focus();

      return;
    }

    if (isEditingText || event.altKey) {
      return;
    }

    if (
      isOnRow &&
      isControl &&
      this.selectionMode === 'multiple' &&
      this.#selectWithShortcut(event, item)
    ) {
      return;
    }

    const items = this.#items;

    const move = {
      ArrowDown: () => items.next(),
      ArrowUp: () => items.previous(),
      End: () => items.last(),
      Home: () => items.first(),
    }[event.key];

    // Modifiers are left alone, other than the ones above and Control or
    // Command with Home and End, so the browser's and the operating system's
    // shortcuts still work.
    if (move && (!isControl || event.key === 'Home' || event.key === 'End')) {
      event.preventDefault(); // Prevent page scroll

      const next = move();

      next?.focus();

      // Moving and toggling, as in a Listbox.
      if (
        next &&
        next !== item &&
        this.selectionMode === 'multiple' &&
        event.shiftKey &&
        (event.key === 'ArrowDown' || event.key === 'ArrowUp')
      ) {
        this.#toggle(next);
      }

      return;
    }

    if (isControl) {
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); // Prevent page scroll
      this.#moveWithinRow(event, item);

      return;
    }

    // The rest are the row's own. On a control, they're the control's.
    if (!isOnRow) {
      return;
    }

    // Space is part of what's being typed while there is something, so "Read
    // me" can be typed out, rather than selecting part-way.
    const isCharacter = [...event.key].length === 1;

    if (isCharacter && (event.key !== ' ' || items.isTyping)) {
      event.preventDefault(); // Prevent page scroll on Space
      items.typeahead(event.key)?.focus();

      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevent page scroll and form submission

      if (
        this.selectionMode === 'multiple' &&
        event.shiftKey &&
        event.key === ' '
      ) {
        this.#selectRange(this.#anchor ?? item, item);
      } else if (this.selectionMode === 'multiple') {
        this.#toggle(item);
      } else if (this.selectionMode === 'single') {
        this.#select(item);
      }
    }
  };

  #onSelectedChange = (event: Event) => {
    if (
      this.selectionMode !== 'multiple' &&
      event.target instanceof GridListItem &&
      event.target.selected &&
      this.items.includes(event.target)
    ) {
      this.#selectOnly(event.target);
    }
  };

  #dispatchChange() {
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  // The Grid List's own row that an event happened in, rather than one in a
  // Grid List nested in it.
  #itemOf(target: EventTarget | null) {
    return this.items.find((item) => {
      return target instanceof Node && item.contains(target);
    });
  }

  // From the row to each of its controls and back to the row, in the reading
  // direction.
  #moveWithinRow(event: KeyboardEvent, item: GridListItem) {
    const stops = [item, ...item.controls];

    // The row, at 0, when focus isn't on one of its controls.
    const current = stops.findLastIndex((stop) => {
      return event.target instanceof Node && stop.contains(event.target);
    });

    const isRtl = getComputedStyle(this).direction === 'rtl';
    const forward = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const step = event.key === forward ? 1 : -1;

    stops.at((current + step) % stops.length)?.focus();
  }

  // What the user's Enter, Space and clicks do when `single`. "change" is only
  // for the user's selections.
  #select(item: GridListItem) {
    this.#anchor = item;

    if (item.selected) {
      return;
    }

    this.#selectOnly(item);
    this.#dispatchChange();
  }

  // Every enabled row, or none when they all are.
  #selectAll() {
    const enabled = this.items.filter(({ disabled }) => !disabled);
    const isAllSelected = enabled.every(({ selected }) => selected);

    for (const item of enabled) {
      item.selected = !isAllSelected;
    }

    this.#dispatchChange();
  }

  #selectOnly(selected: GridListItem) {
    selected.selected = true;

    for (const item of this.items) {
      if (item !== selected) {
        item.selected = false;
      }
    }
  }

  // Every enabled row from one to the other, both included, adding to what's
  // selected. From only `to` when `from` is no longer one of them.
  #selectRange(from: GridListItem, to: GridListItem) {
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

  // Control or Command with A, or with Shift and Home or End. Returns whether
  // it was one of them.
  #selectWithShortcut(event: KeyboardEvent, item: GridListItem) {
    if (!event.shiftKey && event.key.toLowerCase() === 'a') {
      event.preventDefault(); // So the page's text isn't selected
      this.#selectAll();

      return true;
    }

    if (event.shiftKey && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault(); // Prevent page scroll

      const navigable = this.#items.navigableItems;
      const to = event.key === 'Home' ? navigable.at(0) : navigable.at(-1);

      if (to) {
        this.#selectRange(item, to);
        to.focus();
      }

      return true;
    }

    return false;
  }

  // What the user's Enter, Space and clicks do when `multiple`.
  #toggle(item: GridListItem) {
    item.selected = !item.selected;

    if (item.selected) {
      this.#anchor = item;
    }

    this.#dispatchChange();
  }

  // One row is in the page's Tab order. A disabled one can't be focused at
  // all, even by a click.
  #updateItems() {
    const tabbable = this.#tabbableItem;

    for (const item of this.items) {
      item.selectable = this.#isSelectable;

      if (item.disabled) {
        item.removeAttribute('tabindex');
      } else {
        item.tabIndex = item === tabbable ? 0 : -1;
      }
    }
  }
}
