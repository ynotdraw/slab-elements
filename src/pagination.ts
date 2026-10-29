import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import StringsController from './library/strings.js';
import required from './library/required.js';
import styles from './pagination.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-pagination': Pagination;
  }
}

type Item = number | 'end-ellipsis' | 'start-ellipsis';

/**
 * Pagination with no visual styles: a `<nav>` around a list of `<button>`s,
 * one for each page shown, between a previous and a next one.
 *
 * The first and last pages are always shown, and so are `siblings` pages
 * either side of the current one. The pages between those are an ellipsis, so
 * there are always as many items, and the buttons don't move as the page
 * changes.
 *
 * The current page's button has `aria-current="page"`. Previous and Next are
 * `aria-disabled` rather than `disabled` at either end, so focus stays on them
 * when they reach it. Clicking a page sets `page` and dispatches "change".
 *
 * Style it through its parts and `:state(first)` and `:state(last)`, which are
 * set on the first and last pages. The current page's button is also
 * `::part(current)`.
 *
 * @attr {number} total - How many pages there are.
 * @attr {string} [label] - Names the navigation. "Pagination" in English when unset.
 * @attr {string} [next-label] - The next button's text and so its accessible name. "Next" in English when unset.
 * @attr {number} [page=1] - The current page, from 1 to `total`.
 * @attr {string} [previous-label] - The previous button's text and so its accessible name. "Previous" in English when unset.
 * @attr {number} [siblings=1] - How many pages are shown either side of the current one.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @csspart current - The current page's button
 * @csspart ellipsis - In place of the pages that aren't shown
 * @csspart item - Each button's or ellipsis's list item
 * @csspart list - The buttons
 * @csspart nav - The navigation
 * @csspart next - The button to the next page
 * @csspart page - Each page's button
 * @csspart previous - The button to the previous page
 *
 * @fires {Event} change
 *
 * @prop {(page: number) => string} pageLabel - Names each page's button, which shows only the number, from that number. "Page" and the number in English when unset.
 */
@customElement('slab-pagination')
export default class Pagination extends LitElement {
  /**
   * How many pages there are.
   */
  @property({ reflect: true, type: Number })
  @required
  total?: number;

  /**
   * Names the navigation. "Pagination" in English when unset.
   */
  @property({ reflect: true })
  label?: string;

  /**
   * The next button's text and so its accessible name. "Next" in English when
   * unset.
   */
  @property({ attribute: 'next-label', reflect: true })
  nextLabel?: string;

  /**
   * The current page, from 1 to `total`.
   */
  @property({ reflect: true, type: Number, useDefault: true })
  page = 1;

  /**
   * Names each page's button, which shows only the number, from that number.
   * "Page" and the number in English when unset.
   */
  @property({ attribute: false })
  pageLabel: (page: number) => string = (page) =>
    this.#strings.value.paginationPage(page);

  /**
   * The previous button's text and so its accessible name. "Previous" in
   * English when unset.
   */
  @property({ attribute: 'previous-label', reflect: true })
  previousLabel?: string;

  /**
   * How many pages are shown either side of the current one.
   */
  @property({ reflect: true, type: Number, useDefault: true })
  siblings = 1;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  override render() {
    return html`<nav
      aria-label=${this.label ?? this.#strings.value.pagination}
      part="nav"
    >
      <!-- The navigation -->
      <ul part="list">
        <!-- The buttons -->
        <li part="item">
          <!-- Each button's or ellipsis's list item -->
          <button
            aria-disabled=${this.#isFirst ? 'true' : 'false'}
            part="previous"
            type="button"
            @click=${this.#onPreviousClick}
          >
            <!-- The button to the previous page -->
            ${this.previousLabel ?? this.#strings.value.paginationPrevious}
          </button>
        </li>

        ${repeat(
          this.#items,
          (item) => item,
          (item) => this.#renderItem(item),
        )}

        <li part="item">
          <button
            aria-disabled=${this.#isLast ? 'true' : 'false'}
            part="next"
            type="button"
            @click=${this.#onNextClick}
          >
            <!-- The button to the next page -->
            ${this.nextLabel ?? this.#strings.value.paginationNext}
          </button>
        </li>
      </ul>
    </nav>`;
  }

  override updated() {
    this.#setState('first', this.#isFirst);
    this.#setState('last', this.#isLast);
  }

  // Kept to a page that exists, however `page` or `total` was set.
  override willUpdate(changes: PropertyValues<this>) {
    if (changes.has('page') || changes.has('total')) {
      this.page = Math.min(Math.max(this.page, 1), this.#total);
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

  #strings = new StringsController(this);

  get #isFirst() {
    return this.page <= 1;
  }

  get #isLast() {
    return this.page >= this.#total;
  }

  // The first and last pages, `siblings` pages either side of the current one,
  // and an ellipsis for each gap. The window slides rather than shrinking near
  // either end, so there are always as many items. A gap of one page shows
  // that page rather than an ellipsis standing in for it.
  get #items(): Item[] {
    const total = this.#total;
    const siblings = Math.max(this.siblings, 0);

    // As many as there'd be with both ellipses: the first and last pages, the
    // current one, its siblings, and the two ellipses.
    if (total <= siblings * 2 + 5) {
      return range(1, total);
    }

    const start = Math.max(
      Math.min(this.page - siblings, total - siblings * 2 - 2),
      3,
    );

    const end = Math.min(
      Math.max(this.page + siblings, siblings * 2 + 3),
      total - 2,
    );

    return [
      1,
      start > 3 ? 'start-ellipsis' : 2,
      ...range(start, end),
      end < total - 2 ? 'end-ellipsis' : total - 1,
      total,
    ];
  }

  get #total() {
    return Math.max(this.total ?? 1, 1);
  }

  #onNextClick = () => {
    this.#go(this.page + 1);
  };

  #onPageClick = async (event: MouseEvent) => {
    if (
      !(event.currentTarget instanceof HTMLElement) ||
      !this.#go(Number(event.currentTarget.dataset.page))
    ) {
      return;
    }

    // The current page's button is rendered from a template of its own, so
    // its part is one the manifest can document. So it's a new element, and
    // focus goes to it from the one that was clicked.
    await this.updateComplete;

    this.shadowRoot
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.focus();
  };

  #onPreviousClick = () => {
    this.#go(this.page - 1);
  };

  // What the user's clicks do. Nothing at either end, or on the current page.
  // Returns whether the page changed.
  #go(page: number) {
    if (page < 1 || page > this.#total || page === this.page) {
      return false;
    }

    this.page = page;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    return true;
  }

  #renderItem(item: Item) {
    if (item === 'end-ellipsis' || item === 'start-ellipsis') {
      return html`<li part="item ellipsis">
        <!-- In place of the pages that aren't shown -->
        …
      </li>`;
    }

    if (item !== this.page) {
      return html`<li part="item">
        <button
          aria-label=${this.pageLabel(item)}
          data-page=${item}
          part="page"
          type="button"
          @click=${this.#onPageClick}
        >
          <!-- Each page's button -->
          ${item}
        </button>
      </li>`;
    }

    return html`<li part="item">
      <button
        aria-current="page"
        aria-label=${this.pageLabel(item)}
        data-page=${item}
        part="page current"
        type="button"
        @click=${this.#onPageClick}
      >
        <!-- The current page's button -->
        ${item}
      </button>
    </li>`;
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
