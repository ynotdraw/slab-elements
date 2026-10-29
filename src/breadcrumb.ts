import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
} from 'lit';
import { property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import StringsController from './library/strings.js';
import styles from './breadcrumb.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-breadcrumb': Breadcrumb;
  }
}

/**
 * A breadcrumb with no visual styles: a `<nav>` around an `<ol>` of the
 * links slotted into it, the last of which is the current page.
 *
 * An `<ol>` may only hold `<li>`s, so each slotted element gets an `<li>` of its
 * own: it's put in a slot inside one, through the `slot` attribute, which
 * Breadcrumb sets. The last element gets `aria-current="page"` unless it has an
 * `aria-current` already.
 *
 * Separators are a design's, so there are none. Each `<li>` is
 * `::part(item)`, and every one but the first starts with a
 * `::part(separator)`, which is hidden from screenreaders and has no content
 * until you give it some. The `<ol>` keeps its numbers and indent until your
 * styles take them off.
 *
 * @attr {string} [label] - Names the navigation. "Breadcrumb" in English when unset.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element} - The links, from the first page to the current one
 *
 * @csspart item
 * @csspart list - The links
 * @csspart nav - The navigation
 * @csspart separator
 *
 * @readonly
 * @prop {Element[]} items
 */
@customElement('slab-breadcrumb')
export default class Breadcrumb extends LitElement {
  /**
   * Names the navigation. "Breadcrumb" in English when unset.
   */
  @property({ reflect: true })
  label?: string;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  // Children rather than what's slotted, since each child is in a slot of its
  // own.
  get items(): Element[] {
    return [...this.children];
  }

  override render() {
    return html`<nav
      aria-label=${this.label ?? this.#strings.value.breadcrumb}
      part="nav"
    >
      <!-- The navigation -->
      <ol part="list">
        <!-- The links -->
        ${repeat(
          this.slotNames,
          (name) => name,
          (name, index) =>
            html`<li part="item">
              ${
                index > 0
                  ? html`<span aria-hidden="true" part="separator"></span>`
                  : ''
              }
              <slot name=${name}>
                <!--
                  One of the links, put here by Breadcrumb
                  @type {Element}
                  @ignore
                -->
              </slot>
            </li>`,
        )}
      </ol>

      <!-- Hears elements added without a slot, so they can be given one -->
      <slot @slotchange=${this.#onSlotChange}>
        <!--
          The links, from the first page to the current one
          @type {Element}
        -->
      </slot>
    </nav>`;
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

    // A removed or reordered child changes no slot's assignment that the
    // default slot would hear, so the children are watched directly.
    this.#observer.observe(this, { childList: true });
  }

  // The named slots, one per child, in order.
  @state()
  private slotNames: string[] = [];

  // The element given `aria-current` by Breadcrumb, so it's only ever that
  // one that Breadcrumb takes it off again.
  #current?: Element;

  #observer = new MutationObserver(this.#assign.bind(this));

  #strings = new StringsController(this);

  #onSlotChange = () => {
    this.#assign();
  };

  // Puts each child in a slot of its own, in order, and marks the last one as
  // the current page.
  #assign() {
    const items = this.items;

    for (const [index, item] of items.entries()) {
      const name = `item-${index}`;

      if (item.slot !== name) {
        item.slot = name;
      }
    }

    this.slotNames = items.map((_, index) => `item-${index}`);

    const last = items.at(-1);

    if (this.#current && this.#current !== last) {
      this.#current.removeAttribute('aria-current');
      this.#current = undefined;
    }

    if (last && !last.hasAttribute('aria-current')) {
      last.setAttribute('aria-current', 'page');
      this.#current = last;
    }
  }
}
