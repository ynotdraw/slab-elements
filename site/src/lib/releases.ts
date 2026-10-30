// The releases page lists every version in the package's CHANGELOG.md, which
// Changesets writes on each release, so it's current without being touched.
// A release with an announcement, a page of its own with live examples, is
// written here by hand. One that's announced before it's published is listed
// first, as upcoming, until the CHANGELOG has it too.

import changelog from '../../../CHANGELOG.md?raw';
import { version as current } from '../../../package.json';
import { inline } from './prose.ts';

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

  // The short version, a line each, with `code` spans.
  points: string[];
}

export interface Announcement {
  // For the page's description and its card. One sentence.
  summary: string;

  // The page's opening paragraph, with `code` spans.
  intro: string;

  highlights: Highlight[];
  notes?: Note[];
  tldr?: Tldr;
  version: string;
}

export const announcements: Announcement[] = [
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
  const html = inline(body).replaceAll(
    /\[([^\]]+)\]\((https:[^)\s]+)\)/g,
    '<a href="$2">$1</a>',
  );

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
