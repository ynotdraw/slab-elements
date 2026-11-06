// The releases page lists every version in the package's CHANGELOG.md, which
// Changesets writes on each release, so it's current without being touched.
// A release with an announcement, a page of its own with live examples, is
// written here by hand. One that's announced before it's published is listed
// first, as upcoming, until the CHANGELOG has it too.

import changelog from '../../../CHANGELOG.md?raw';
import { version as current } from '../../../package.json';
import { linked } from './prose.ts';

export interface Highlight {
  // The component's page, from `src/content/components`, whose summary,
  // example and usage are shown unless they're given here.
  component: string;

  // The styled example, live, when the component's own isn't the one to show.
  example?: string;

  // What changed, a sentence or two, with `code` spans.
  text: string;

  title: string;

  // The headless markup, when the component's own usage isn't the one to show.
  usage?: string;

  // In a TL;DR, a tile across the row, for a wide example.
  wide?: boolean;
}

// News that isn't a component, such as a change to these docs, after the
// highlights.
export interface Note {
  // A component whose usage is shown in each framework, as an example.
  component?: string;
  id: string;

  // A sentence or two, with `code` spans and [links](path) from the site's
  // root.
  text: string;

  title: string;
}

// A smaller addition, a line or two, in a TL;DR announcement.
export interface Addition {
  // From the site's root, such as "components/menu/".
  href: string;
  text: string;
  title: string;
}

// A fix, a line, and the components' pages it's in.
export interface Fix {
  components: string[];
  text: string;
}

// A change that can break what you have, with the CSS before and after.
export interface Check {
  after: string;
  before: string;
  text: string;
  title: string;
}

// A release that's too big to walk through a component at a time is a
// TL;DR instead: its numbers, a few lines, a tile per new component, and
// every fix a line each. The numbers are counted from the rest.
export interface Tldr {
  additions: Addition[];
  checks: Check[];
  fixes: { fixes: Fix[]; title: string }[];

  // The fixes' heading and the line under it, when they're not all from an
  // accessibility audit.
  fixesLede?: string;
  fixesTitle?: string;

  // The short version, a line each, with `code` spans.
  points: string[];

  // A major version's breaking changes are in its upgrade guide rather than
  // in `checks`, and "Before you upgrade" links to each of its sections.
  upgradeGuide?: boolean;
}

// A release dedicated to someone, at the top of its page.
export interface Dedication {
  // Who wrote it.
  by: string;

  // Where to give in their memory, a sentence with a [link](https://…).
  donation: string;

  // A link to them, such as their GitHub profile.
  href: string;

  // Who it's dedicated to.
  name: string;

  // The dedication, word for word as it was written.
  text: string;
}

export interface Announcement {
  // For the page's description and its card. One sentence.
  summary: string;

  // The page's opening paragraph, with `code` spans.
  intro: string;

  dedication?: Dedication;
  highlights: Highlight[];
  notes?: Note[];
  tldr?: Tldr;
  version: string;
}

export const announcements: Announcement[] = [
  {
    version: '1.0.0',
    dedication: {
      by: 'Tony Ward',
      donation:
        "If you'd like to remember Doug too, please consider a donation to the [Melanoma Research Alliance](https://give.curemelanoma.org/give/296895/#!/donation/checkout), which funds melanoma research.",
      href: 'https://github.com/dmiller9911',
      name: 'Doug Miller',
      text: 'This 1.0 release is dedicated to my childhood friend, Doug Miller. We were friends for 30 years. He got me into web development and open source software. He lost his battle with melanoma last year. Today is his birthday. So I dedicate this to him. Rest in peace, buddy. I love and miss you.',
    },
    summary:
      'A stable API: typed events for every framework, custom states in the manifest, and validity, read-only fields and opening from code where they were missing.',
    intro:
      "1.0.0 adds no components. It fills the gaps between the ones there are, so each attribute, method and event works the same way wherever it appears, and it settles the API: from here, nothing is removed without a deprecation first. It's a major release, with a few changes to check before you upgrade.",
    tldr: {
      points: [
        'Every event is typed in React, Vue, Svelte and plain TypeScript, down to its `detail`.',
        'Each custom state is in `custom-elements.json` with a description, so `:state()` selectors are documented beside parts and attributes.',
        '`readonly`, the validity API, `show()` and `hide()`, and a cancelable "beforetoggle" are on every element they make sense for.',
        'Every element with `open` dispatches "toggle" as a `ToggleEvent`.',
        'Nothing goes away without a deprecation first, and a deprecated API lasts until the next major version.',
      ],
      additions: [
        {
          title: 'Typed events',
          href: 'get-started/#typescript',
          text: 'The JSX, Vue and Svelte types include an `on` prop for each event, and `SlabElementEvents` maps each element to its events for `addEventListener`.',
        },
        {
          title: 'Custom states',
          href: 'components/',
          text: "Each component's page lists its `:state()`s in a table beside its parts, and so does `custom-elements.json`.",
        },
        {
          title: 'Read-only fields',
          href: 'components/combobox/',
          text: "Combobox and Tags Input take `readonly`, as Rating does: the value stays focusable and is submitted, but can't be changed.",
        },
        {
          title: 'Validity',
          href: 'components/slider/',
          text: 'Slider, Range Slider, Color Picker and Editable have `setCustomValidity()`, `validationMessage` and a `validity-message` part, like the other fields.',
        },
        {
          title: 'Opening from code',
          href: 'components/tooltip/',
          text: 'Tooltip, Hover Card and Combobox open and close from code without their delays, as Popover and Menu do.',
        },
        {
          title: 'Stopping an open',
          href: 'get-started/',
          text: 'Every element built on a popover dispatches a cancelable "beforetoggle" before it opens or closes, so an open can be stopped.',
        },
        {
          title: 'Toggle events everywhere',
          href: 'components/dialog/',
          text: 'Dialog, Alert Dialog, Drawer and Toast dispatch "toggle" too, so every element with `open` has it.',
        },
        {
          title: 'Deprecations',
          href: 'get-started/#deprecations',
          text: 'How an API goes away after 1.0: a `@deprecated` note in the types and the manifest, a badge in these docs, and a minor release or more before the next major removes it.',
        },
        {
          title: 'Upgrade to 1.0',
          href: 'upgrade/',
          text: 'Every change since 0.1 that can break something, in one guide, with what to change for each.',
        },
      ],
      fixes: [],
      checks: [],
      upgradeGuide: true,
    },
    highlights: [],
  },
  {
    version: '0.3.1',
    summary:
      'Eight new components, from Table to Date Range Picker, submenus in Menu, and Listboxes of thousands of Options.',
    intro:
      "0.3.1 brings eight new components, submenus for Menu, and a `virtual` attribute for Listbox and Combobox that keeps a list of thousands of Options quick. It's a patch release with nothing to restyle, so updating is safe.",
    tldr: {
      points: [
        'Eight new components, each headless, with its keyboard, ARIA and form support done.',
        'Table, Grid List and Sortable List for data, and Date Picker and Date Range Picker for days.',
        'Menus open submenus, from the keyboard, a click or the pointer resting on a Menu Item.',
        'Listbox and Combobox take `virtual`, and are much faster with long lists either way.',
        'Nothing to restyle: every change adds to what you have.',
      ],
      additions: [
        {
          title: 'Submenus',
          href: 'components/menu/',
          text: 'A `slab-menu` inside another, with a `slab-menu-item` as its anchor, opens beside that Menu Item. Right, Enter or a pause under the pointer opens it, and Left or Escape closes it.',
        },
        {
          title: 'Virtual lists',
          href: 'components/listbox/',
          text: '`virtual` on Listbox and Combobox lays out only the Options near view, while the keys, typeahead, filtering and selection still reach every one.',
        },
        {
          title: 'Showcase',
          href: 'showcase/',
          text: 'Four pages built from Slab and themed four ways, to see the components together in something like an app.',
        },
      ],
      fixesTitle: 'Fixes',
      fixesLede: "A line each, and the components it's in.",
      fixes: [
        {
          title: 'Screenreaders',
          fixes: [
            {
              text: "The anchor's `aria-details` points at the card, and a `label` makes the card a named group.",
              components: ['hover-card'],
            },
          ],
        },
        {
          title: 'Speed',
          fixes: [
            {
              text: 'A thousand Options appear at once rather than in seconds, since an Option that connects or changes no longer makes work for every other.',
              components: ['listbox', 'combobox'],
            },
          ],
        },
      ],
      checks: [],
    },
    highlights: [
      {
        component: 'table',
        wide: true,
        title: 'Table',
        text: 'Rows and cells that components can render into, laid out like a native `<table>`. A `sortable` Column Header sorts its column and says how.',
      },
      {
        component: 'alert-dialog',
        title: 'Alert Dialog',
        text: "A modal Dialog that asks before something can't be undone. Focus starts on Cancel, and a click outside doesn't close it.",
      },
      {
        component: 'toggle-button',
        title: 'Toggle Button',
        text: "A native button with `aria-pressed`, for one setting that's on or off, such as Bold or Mute.",
      },
      {
        component: 'grid-list',
        wide: true,
        title: 'Grid List',
        text: 'Rows that hold their own buttons, links and checkboxes. Up and Down move between rows, Left and Right into them, and rows can be selected.',
      },
      {
        component: 'date-picker',
        title: 'Date Picker',
        text: 'A Date Field with a button that opens a Calendar in a popover, the same in every browser and yours to style.',
      },
      {
        component: 'search-field',
        title: 'Search Field',
        text: 'A search input with a button that clears it, and Escape that does the same in every browser.',
      },
      {
        component: 'date-range-picker',
        wide: true,
        title: 'Date Range Picker',
        text: 'A Date Range Field with one range Calendar in a popover, so the start and the end are picked together.',
      },
      {
        component: 'sortable-list',
        wide: true,
        title: 'Sortable List',
        text: "A list put in order by dragging each item's handle or with the keyboard, while a screenreader hears where the item is.",
      },
    ],
  },
  {
    version: '0.3.0',
    summary:
      'Values screenreaders read the way you mean them, headings in Disclosure, dialogs in Popover, and the rest of the accessibility audit.',
    intro:
      "0.3.0 finishes the accessibility audit 0.2.0 began. Sliders, meters and ratings can say what their numbers mean, Disclosure and Popover take the roles they're used for, and Calendar, File Drop and Command Palette say what just happened. It's a minor release because Splitter's separator moved its focus, so check how you style it.",
    tldr: {
      points: [
        'Slider, Range Slider, Meter, Progress and Rating take `formatValue`, so a screenreader reads "$40" or "3 of 5 GB" rather than a bare number.',
        "Disclosure's label can be a heading, and a Popover with a `label` is a dialog.",
        'Calendar ranges, File Drop and Command Palette tell screenreaders what just happened.',
        "Splitter's separator is a native range input inside, so phone screenreaders move it with a swipe.",
        "Splitter's focus ring moves to a `focus-visible` part.",
      ],
      additions: [
        {
          title: 'Values that read right',
          href: 'components/slider/',
          text: '`formatValue`, a function of the value whose result screenreaders read, such as "$40" or "3 stars", in Slider, Range Slider, Meter, Progress and Rating.',
        },
        {
          title: 'Disclosure headings',
          href: 'components/disclosure/',
          text: "`heading-level` puts Disclosure's label in a heading of that level, as the APG's accordion does, so it's in a screenreader's list of headings.",
        },
        {
          title: 'Popover dialogs',
          href: 'components/popover/',
          text: 'With `label`, a Popover is a non-modal dialog named by it, for one that holds a form or controls rather than a few words.',
        },
      ],
      fixesTitle: 'Fixes',
      fixesLede:
        "The last of the accessibility audit, and two parts back in the manifest. A line each, and the components it's in.",
      fixes: [
        {
          title: 'Screenreaders',
          fixes: [
            {
              text: "A range's first day, and then the whole range, are announced as they're picked.",
              components: ['calendar'],
            },
            {
              text: 'A drop says how many files were added, and how many were left out.',
              components: ['file-drop'],
            },
            {
              text: 'How many results are left is announced once typing pauses, as in Combobox.',
              components: ['command-palette'],
            },
          ],
        },
        {
          title: 'Touch and target size',
          fixes: [
            {
              text: 'The separator is a native range input, so phone screenreaders move it with a swipe.',
              components: ['splitter'],
            },
            {
              text: "The styled box is 24 pixels square, WCAG 2.5.8's smallest target.",
              components: ['checkbox'],
            },
          ],
        },
        {
          title: 'Editors and docs',
          fixes: [
            {
              text: "The thumbs' parts are listed in the elements manifest again.",
              components: ['range-slider', 'color-picker'],
            },
          ],
        },
      ],
      checks: [
        {
          title: "Splitter's focus ring",
          text: "The separator holds a hidden range input that takes focus, so it isn't `[role=separator]` and doesn't match `:focus-visible`. Style its ring through the `focus-visible` part.",
          before:
            'slab-splitter::part(separator):focus-visible {\n  outline: 3px solid;\n}',
          after:
            'slab-splitter::part(separator focus-visible) {\n  outline: 3px solid;\n}',
        },
      ],
    },
    highlights: [],
  },
  {
    version: '0.2.0',
    summary:
      'Ten new components, from Command Palette to Feed, translations, and an accessibility pass over the rest.',
    intro:
      "0.2.0 brings ten new components, `registerStrings()` to translate what the elements say, and the fixes from an accessibility audit of every component. It's a minor release because Range Slider's and Color Picker's thumbs moved their focus, so check how you style it.",
    tldr: {
      points: [
        'Ten new components, each headless, with its keyboard, ARIA and form support done.',
        'Checkbox and radio Menu Items, and Option Groups for Listbox, Select and Combobox.',
        "`registerStrings()` translates the words Slab's elements say on their own.",
        'Screenreaders now hear the labels, hints, errors and results they used to miss.',
        "Range Slider's and Color Picker's focus rings move to a `focus-visible` part.",
      ],
      additions: [
        {
          title: 'Checkbox and radio Menu Items',
          href: 'components/menu/',
          text: 'Menu Item takes `type="checkbox"` or `type="radio"`, and the new Menu Group names a set of radios in a Menu or Context Menu.',
        },
        {
          title: 'Option Group',
          href: 'components/listbox/',
          text: "Options under a heading in Listbox, Select and Combobox. The arrow keys and typeahead go across groups, and Combobox hides one that's filtered empty.",
        },
        {
          title: 'Translations',
          href: 'get-started/#words',
          text: '`registerStrings()`, from `slab-elements/strings.js`, words what the elements say, such as "Dismiss" or "Next slide", for the nearest `lang`.',
        },
      ],
      fixes: [
        {
          title: 'Screenreaders',
          fixes: [
            {
              text: "`aria-*` on a component's host reaches the element a screenreader reads.",
              components: [
                'checkbox',
                'color-picker',
                'combobox',
                'date-field',
                'disclosure',
                'file-drop',
                'number',
                'pin-input',
                'range-slider',
                'slider',
                'switch',
                'text-field',
                'textarea',
                'time-field',
              ],
            },
            {
              text: "The browser's own message, in its language, when a built-in constraint fails.",
              components: [
                'text-field',
                'textarea',
                'number',
                'date-field',
                'time-field',
                'file-drop',
                'checkbox',
                'checkbox-group',
                'radio-group',
                'listbox',
                'select',
                'combobox',
                'rating',
                'pin-input',
              ],
            },
            {
              text: "Field's description and error describe its control, and mark it invalid.",
              components: ['field'],
            },
            {
              text: "Groups and Switch say when they're invalid.",
              components: ['checkbox-group', 'radio-group', 'switch'],
            },
            {
              text: 'Combobox announces how many results are left, and which tag was removed.',
              components: ['combobox'],
            },
          ],
        },
        {
          title: 'Keyboard',
          fixes: [
            {
              text: 'Left and Right follow the reading direction, right to left too.',
              components: [
                'tabs',
                'toolbar',
                'toggle-group',
                'radio-group',
                'menubar',
                'tree',
                'calendar',
                'color-picker',
                'combobox',
              ],
            },
            {
              text: "Enter is left to an input method while it's composing.",
              components: ['text-field', 'number', 'pin-input', 'combobox'],
            },
            {
              text: "A click on the label focuses the control, as a native select's does.",
              components: ['select', 'listbox'],
            },
            {
              text: 'Toasts with an action stay open, and F6 moves focus to them.',
              components: ['toast'],
            },
          ],
        },
        {
          title: 'Motion, color and touch',
          fixes: [
            {
              text: 'Autoplay stops under reduced motion, and for good once focus moves in.',
              components: ['carousel'],
            },
            {
              text: 'The colors to pick from stay in forced colors.',
              components: ['color-picker'],
            },
            {
              text: 'Thumbs are native range inputs, so phone screenreaders adjust them with a swipe.',
              components: ['range-slider', 'color-picker'],
            },
          ],
        },
      ],
      checks: [
        {
          title: "Range Slider's focus ring",
          text: "Each thumb holds a hidden range input that takes focus, so the thumb itself isn't `[role=slider]` and doesn't match `:focus-visible`. Style its ring through the `focus-visible` part.",
          before:
            'slab-range-slider::part(start):focus-visible {\n  outline: 3px solid;\n}',
          after:
            'slab-range-slider::part(start focus-visible) {\n  outline: 3px solid;\n}',
        },
        {
          title: "Color Picker's focus ring",
          text: 'The same for the area, hue and alpha thumbs. The area has a second hidden input, for brightness, out of the tab order.',
          before:
            'slab-color-picker::part(hue-thumb):focus-visible {\n  outline: 3px solid;\n}',
          after:
            'slab-color-picker::part(hue-thumb focus-visible) {\n  outline: 3px solid;\n}',
        },
      ],
    },
    highlights: [
      {
        component: 'command-palette',
        title: 'Command Palette',
        text: 'A Dialog with a search box and a list of commands. Typing filters them, and Enter runs the best match.',
      },
      {
        component: 'hover-card',
        title: 'Hover Card',
        text: 'A preview of where a link goes, on hover and keyboard focus, with room for links of its own.',
      },
      {
        component: 'navigation-menu',
        wide: true,
        title: 'Navigation Menu',
        text: "A site's navigation as the APG's disclosure navigation: buttons that show lists of links.",
      },
      {
        component: 'tags-input',
        title: 'Tags Input',
        text: "A text input that turns what's typed or pasted into tags, each submitted as its own value.",
      },
      {
        component: 'editable',
        title: 'Editable',
        text: 'Text edited in place: a button that becomes an input. Enter commits and Escape discards.',
      },
      {
        component: 'date-range-field',
        wide: true,
        title: 'Date Range Field',
        text: 'Two native date inputs, each bounded by the other, that submit a start and an end.',
      },
      {
        component: 'copy-button',
        title: 'Copy Button',
        text: "Copies `value`, or another element's text with `from`, and says so to screenreaders.",
      },
      {
        component: 'password-field',
        title: 'Password Field',
        text: 'A password input with a toggle button that shows and hides what was typed.',
      },
      {
        component: 'steps',
        wide: true,
        title: 'Steps',
        text: 'Where the user is in a checkout or a wizard, with Steps they can go back to when `navigable`.',
      },
      {
        component: 'feed',
        wide: true,
        title: 'Feed',
        text: 'Articles that load as the user scrolls, with Page Down and Page Up between them.',
      },
    ],
  },
  {
    version: '0.1.3',
    summary:
      'Nine new components, from Menubar to Color Picker, and ranges of days in Calendar.',
    intro:
      "0.1.3 is Slab's biggest release since the first. It fills in most of what was left of the APG's patterns, with nine new components and a `range` attribute for Calendar. Each is headless, as ever: the keyboard, focus, ARIA and forms are done, and the look is yours. Every example below is live, and styled the way this site styles them.",
    highlights: [
      {
        component: 'menubar',
        title: 'Menubar',
        text: 'A row of Menus, such as File, Edit and View, as in a desktop app. Tab reaches it once, and Left and Right move between the Menus, open or not. Each Menu is a plain `slab-menu`, unchanged.',
      },
      {
        component: 'context-menu',
        title: 'Context Menu',
        text: "Menu Items in place of the browser's own menu, opened at the pointer on a right-click, where it was pressed on a long-press, and from the keyboard with Shift+F10 or the Menu key.",
      },
      {
        component: 'carousel',
        title: 'Carousel',
        text: "Slides in a CSS scroll snap container, so swiping and scrolling are the browser's own. Previous, Next and the markers are real buttons, so they work and look the same in every browser, and slides out of view are `inert`.",
      },
      {
        component: 'color-picker',
        title: 'Color Picker',
        text: 'A saturation and brightness area, hue and alpha sliders, a hex field and swatches, all from the keyboard as well as the pointer. The form gets a "#rrggbb", or "#rrggbbaa" with `alpha`.',
      },
      {
        component: 'rating',
        title: 'Rating',
        text: 'Native radios, one per star, that preview the value under the pointer. With `step="0.5"`, each star is two radios, so the value can be a half.',
      },
      {
        component: 'pin-input',
        title: 'Pin Input',
        text: 'A PIN or one-time code as a row of inputs that submits as one value. A pasted or autofilled code is spread across them, with separators like "-" left out.',
      },
      {
        component: 'splitter',
        title: 'Splitter',
        text: 'Two panes and a separator between them that resizes them. Drag it, move it with the arrow keys, or press Enter to collapse the first pane and restore it.',
      },
      {
        component: 'range-slider',
        title: 'Range Slider',
        text: 'Two thumbs on one track for a range, such as a price from and to. They can meet but not pass, and the form gets both values.',
      },
      {
        component: 'time-field',
        title: 'Time Field',
        text: 'A native time input with the same API as Date Field. Its value is a 24-hour "hh:mm" whatever clock the browser shows, and a `max` earlier than `min` is a range across midnight.',
      },
      {
        component: 'calendar',
        title: 'Calendar ranges',
        text: 'Calendar takes `range`, to pick a range of days rather than one. The first day picked starts it and the second ends it, and `value` is an ISO 8601 interval, "yyyy-mm-dd/yyyy-mm-dd".',
        example:
          '<slab-styled-calendar range value="2026-10-19/2026-10-23"></slab-styled-calendar>',
        usage:
          '<slab-calendar range value="2026-03-09/2026-03-13"></slab-calendar>',
      },
    ],
    notes: [
      {
        id: 'frameworks',
        title: 'Docs in your framework',
        component: 'range-slider',
        text: "Every component's page now shows its usage in React, Lit, Vue and Svelte, as well as plain HTML. And its styled example, under \"Copy and own it\", comes in each too: the Lit subclass, or the same styles as plain CSS with a small component around the element for React and Vue. Here's [Range Slider](components/range-slider/)'s usage.",
      },
    ],
  },
];

// "0.1.10" is after "0.1.9", so they're compared a number at a time.
const compare = (a: string, b: string) => {
  const [x, y] = [a, b].map((version) => version.split('.').map(Number));

  for (let index = 0; index < 3; index++) {
    const difference = (x![index] ?? 0) - (y![index] ?? 0);

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
};

/** Whether a version is out, by the package's own version. */
export const isPublished = (version: string) => compare(version, current) <= 0;

export interface Release {
  announcement?: Announcement;

  // Each change, as HTML: one line of text, with `code` spans and links.
  changes: string[];

  // The same changes as Markdown, for the page's twin.
  markdown: string[];

  published: boolean;
  version: string;
}

// Changesets writes each change as "[#11](…) [`e5b3ee2`](…) Thanks
// [@ynotdraw](…)! - Combobox takes…". The pull request is kept, and the
// commit and the thanks are left out.
const parse = (text: string) => ({
  body: text.replace(/^.*?Thanks \[@[^\]]+\]\([^)]+\)! - /, ''),
  pr: /^\[#(\d+)\]\(([^)]+)\)/.exec(text),
});

const change = (text: string) => {
  const { body, pr } = parse(text);

  // Links in the change itself, after it's escaped.
  const html = linked(body);

  return pr ? `${html} <a class="pr" href="${pr[2]}">#${pr[1]}</a>` : html;
};

const changeMarkdown = (text: string) => {
  const { body, pr } = parse(text);

  return pr ? `${body} ([#${pr[1]}](${pr[2]}))` : body;
};

/** Every release, newest first, with any announced but not out yet first. */
export function releases(): Release[] {
  const logged = changelog
    .split(/^## /m)
    .slice(1)
    .map((section) => {
      const [version = '', ...lines] = section.split('\n');

      const items = lines
        .join('\n')
        .split(/^- /m)
        .slice(1)
        .map((item) => item.replace(/\n#{3}[^\n]*/g, '').trim());

      return {
        changes: items.map(change),
        markdown: items.map(changeMarkdown),
        version: version.trim(),
      };
    });

  const upcoming = announcements
    .filter(
      ({ version }) => !logged.some((release) => release.version === version),
    )
    .map(({ version }) => ({ changes: [], markdown: [], version }));

  return [...upcoming, ...logged]
    .sort((a, b) => compare(b.version, a.version))
    .map((release) => ({
      ...release,
      announcement: announcements.find(
        ({ version }) => version === release.version,
      ),
      published: isPublished(release.version),
    }));
}
