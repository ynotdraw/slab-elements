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
import assertSlot from './library/assert-slot.js';
import required from './library/required.js';
import RovingTabindex from './library/roving-tabindex.js';
import uniqueId from './library/unique-id.js';
import Panel from './tabs.panel.js';
import Tab from './tabs.tab.js';
import styles from './tabs.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-tabs': Tabs;
  }
}

/**
 * Tabs and their Panels, with no visual styles.
 *
 * There's no native tab list, so this is a `[role=tablist]` holding Tabs, with
 * the Panels beside it. Tabs and Panels are found by class rather than by tag
 * name, so your subclasses of them can be named anything.
 *
 * Exactly one Tab is selected and exactly one is tabbable: the selected one.
 * The arrow keys move focus between Tabs, wrapping at each end and skipping
 * disabled ones: Left and Right, or Up and Down when `orientation` is
 * `"vertical"`. Home and End go to the first and last. Focus selects the Tab it
 * lands on, unless `manual` is set, where Space and Enter do. A click selects
 * either way. In a right-to-left page, Left and Right swap.
 *
 * Each Tab is wired to the Panel whose `name` matches its `panel` with
 * `aria-controls` and `aria-labelledby`, and every other Panel is `hidden`.
 *
 * Style it through its parts, each Tab through `:state(disabled)` and
 * `:state(selected)`, and each Panel directly.
 *
 * @attr {string} label - Names the tab list.
 * @attr {boolean} [manual=false] - Space and Enter select the focused Tab rather than focus itself, for Panels that are slow to show.
 * @attr {'horizontal'|'vertical'} [orientation='horizontal'] - Which arrow keys move between Tabs. Where they sit is still up to your styles.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Panel}
 * @slot {Tab} [tab]
 *
 * @csspart tablist - The Tabs
 *
 * @fires {Event} change
 *
 * @readonly
 * @prop {Panel[]} panels
 *
 * @readonly
 * @prop {Tab | null} selectedTab
 *
 * @readonly
 * @prop {Tab[]} tabs
 */
@customElement('slab-tabs')
export default class Tabs extends LitElement {
  /**
   * Names the tab list.
   */
  @property({ reflect: true })
  @required
  label?: string;

  /**
   * Space and Enter select the focused Tab rather than focus itself, for
   * Panels that are slow to show.
   */
  @property({ reflect: true, type: Boolean })
  manual = false;

  /**
   * Which arrow keys move between Tabs. Where they sit is still up to your
   * styles.
   */
  @property({ reflect: true, useDefault: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  // Direct children rather than a query, so a renamed subclass still counts
  // and a Panel inside another component doesn't.
  get panels(): Panel[] {
    return [...this.children].filter((element) => element instanceof Panel);
  }

  get selectedTab(): Tab | null {
    return this.tabs.find(({ selected }) => selected) ?? null;
  }

  get tabs(): Tab[] {
    return [...this.children].filter((element) => element instanceof Tab);
  }

  override firstUpdated() {
    this.#settle();
  }

  override focus(options?: FocusOptions) {
    this.#rovingTabindex.tabbableItem?.focus(options);
  }

  override render() {
    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    return html`<div
        aria-label=${ifDefined(this.label)}
        aria-orientation=${this.orientation}
        part="tablist"
        role="tablist"
        @click=${this.#onClick}
        @keydown=${this.#onKeydown}
      >
        <!-- The Tabs -->
        <slot name="tab" ${assertSlot([Tab])} @slotchange=${this.#onSlotchange}>
          <!-- @type {Tab} -->
        </slot>
      </div>

      <slot ${assertSlot([Panel], true)} @slotchange=${this.#onSlotchange}>
        <!-- @type {Panel} -->
      </slot>`;
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
    this.addEventListener('private-disabled-change', this.#onDisabledChange);
    this.addEventListener('private-panel-change', this.#onConnected);
    this.addEventListener('private-selected-change', this.#onSelectedChange);
  }

  // Wrapping at each end, as the APG's tabs do.
  #rovingTabindex = new RovingTabindex<Tab>({
    hasHomeAndEnd: true,
    isNavigable: ({ disabled }) => !disabled,
    items: () => this.tabs,
    orientation: () => this.orientation,
  });

  #onClick = (event: MouseEvent) => {
    const tab = this.tabs.find((tab) => {
      return event.target instanceof Node && tab.contains(event.target);
    });

    if (tab && !tab.disabled) {
      this.#select(tab, true);
      tab.focus();
    }
  };

  #onConnected = (event: Event) => {
    if (this.#isOwn(event)) {
      this.#settle();
    }
  };

  #onDisabledChange = (event: Event) => {
    if (this.#isOwn(event)) {
      this.#settle();
    }
  };

  #onKeydown = (event: KeyboardEvent) => {
    const tab = this.tabs.find((tab) => tab === event.target);

    // A disabled Tab can still have focus, from a click.
    if (
      !tab ||
      tab.disabled ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault(); // Prevent page scroll
      this.#select(tab, true);

      return;
    }

    const next = this.#rovingTabindex.next(event, tab);

    if (!next) {
      return;
    }

    event.preventDefault(); // Prevent page scroll

    this.#rovingTabindex.makeTabbable(next);
    next.focus();

    if (!this.manual) {
      this.#select(next, true);
    }
  };

  #onSelectedChange = (event: Event) => {
    if (!this.#isOwn(event) || !(event.target instanceof Tab)) {
      return;
    }

    // Tab dispatches from `updated()`, so this also hears Tabs' own selections
    // a microtask later. Selecting the same Tab again changes nothing.
    if (event.target.selected) {
      this.#select(event.target, false);
    } else {
      this.#settle();
    }
  };

  // Hears a Tab or Panel removed, or one already upgraded moved in, neither of
  // which a "private-connected" announces.
  #onSlotchange = () => {
    this.#settle();
  };

  #isOwn(event: Event) {
    return (
      (event.target instanceof Tab || event.target instanceof Panel) &&
      event.target.parentElement === this
    );
  }

  // Selects one Tab and deselects the rest, shows its Panel, and wires every
  // Tab to its Panel. "change" is only for the user's selections.
  #select(selected: Tab, isUser: boolean) {
    const isChange = !selected.selected || this.#selectedCount() > 1;

    for (const tab of this.tabs) {
      tab.selected = tab === selected;
    }

    this.#rovingTabindex.makeTabbable(selected);
    this.#wire();

    if (isUser && isChange) {
      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
  }

  #selectedCount() {
    return this.tabs.filter(({ selected }) => selected).length;
  }

  // Run once the Tabs are there, and again whenever one is added, removed or
  // changes. The last Tab
  // that says it's selected wins, or the first enabled Tab when none does or
  // the selected one is disabled.
  #settle() {
    const declared = this.tabs.findLast(({ disabled, selected }) => {
      return selected && !disabled;
    });

    const selected = declared ?? this.#rovingTabindex.navigableItems.at(0);

    if (selected) {
      this.#select(selected, false);
    } else {
      this.#wire();
    }
  }

  #wire() {
    const panels = this.panels;

    for (const tab of this.tabs) {
      const panel = panels.find(({ name }) => name === tab.panel);

      // IDs rather than element references, which Playwright and Axe don't
      // read. Tabs and Panels are both in the light DOM, so they resolve.
      if (panel) {
        tab.id ||= `tab-${uniqueId()}`;
        panel.id ||= `panel-${uniqueId()}`;

        tab.setAttribute('aria-controls', panel.id);
        panel.setAttribute('aria-labelledby', tab.id);
      } else {
        tab.removeAttribute('aria-controls');
      }
    }

    for (const panel of panels) {
      const tab = this.tabs.find(({ panel: name }) => name === panel.name);
      panel.hidden = !tab?.selected;

      if (!tab) {
        panel.removeAttribute('aria-labelledby');
      }
    }
  }
}
