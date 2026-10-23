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
import ListItemSlots from './library/list-item-slots.js';
import required from './library/required.js';
import RovingTabindex from './library/roving-tabindex.js';
import NavigationMenuItem from './navigation-menu.item.js';
import styles from './navigation-menu.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-navigation-menu': NavigationMenu;
  }
}

/**
 * A Navigation Menu with no visual styles: a site's navigation, as a `<nav>`
 * around a `<ul>` of links and Navigation Menu Items, each Item a button that
 * shows and hides links of its own.
 *
 * It's the APG's disclosure navigation, not a menu. A `[role=menu]` is for
 * commands, like a desktop app's, and tells a screenreader user to expect
 * the arrow keys and nothing else. Here the links are links, the buttons are
 * buttons with `aria-expanded`, and Tab goes through all of them in order.
 *
 * Each element slotted into it gets an `<li>` of its own, as in Breadcrumb.
 * Opening one Item closes the others, and the arrow keys are a shortcut on top
 * of Tab: Left and Right move between the links and Items' buttons in the
 * row, wrapping at each end, and Home and End go to the first and last.
 *
 * Mark the link to the current page with `aria-current="page"`.
 *
 * @attr {string} label - Names the navigation.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element} - The links and Navigation Menu Items, each in an `<li>` of its own
 *
 * @csspart item
 * @csspart list - The links and Items
 * @csspart nav - The navigation
 *
 * @readonly
 * @prop {Element[]} items
 */
@customElement('slab-navigation-menu')
export default class NavigationMenu extends LitElement {
  /**
   * Names the navigation.
   */
  @property({ reflect: true })
  @required
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
      aria-label=${ifDefined(this.label)}
      part="nav"
      @keydown=${this.#onKeydown}
      @toggle=${this.#onToggle}
    >
      <!-- The navigation -->
      <ul part="list">
        <!-- The links and Items -->
        ${repeat(
          this.#listItemSlots.names,
          (name) => name,
          (name) =>
            html`<li part="item">
              <slot name=${name}>
                <!--
                  One of the links or Items, put here by Navigation Menu
                  @type {Element}
                  @ignore
                -->
              </slot>
            </li>`,
        )}
      </ul>

      <!-- Hears elements added without a slot, so they can be given one -->
      <slot @slotchange=${this.#listItemSlots.assign}>
        <!--
          The links and Navigation Menu Items, each in an \`<li>\` of its own
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

  #listItemSlots = new ListItemSlots(this);

  // Only for which element a key moves to. Nothing here roves: every link and
  // button stays in the tab sequence, since Tab is how a navigation is used.
  #rovingTabindex = new RovingTabindex<HTMLElement>({
    hasHomeAndEnd: true,
    isNavigable: (element) => {
      return (
        (element instanceof NavigationMenuItem || element.tabIndex >= 0) &&
        !element.matches(':disabled')
      );
    },
    items: () => {
      return this.items.filter((element) => element instanceof HTMLElement);
    },
    orientation: () => 'horizontal',
  });

  // Only from the row itself: a link or an Item's button, which is heard as
  // the Item. Keys from inside an Item's content are the Item's.
  #onKeydown = (event: KeyboardEvent) => {
    const from = this.#rovingTabindex.navigableItems.find((element) => {
      return element === event.target;
    });

    if (
      !from ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    const next = this.#rovingTabindex.next(event, from);

    if (next) {
      event.preventDefault(); // Prevent page scroll
      next.focus();
    }
  };

  // Opening one Item closes the others in the row. An Item nested in another
  // one's content isn't in the row, and opening it closes nothing.
  #onToggle = (event: ToggleEvent) => {
    if (
      event.newState !== 'open' ||
      !this.items.includes(event.target as Element)
    ) {
      return;
    }

    for (const item of this.items) {
      if (item instanceof NavigationMenuItem && item !== event.target) {
        item.hide();
      }
    }
  };
}
