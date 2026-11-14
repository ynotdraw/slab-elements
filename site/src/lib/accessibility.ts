// What Slab does for accessibility, how it's tested, and what hasn't been
// checked yet, in the same shape as Get started so the page and its Markdown
// twin share one renderer. Keep it to what's true today: when a screen reader
// pass is done, say which one, on what, and when.
import { type Section } from './get-started.ts';

export const title = 'Accessibility';

export const summary =
  "What Slab does for accessibility, how it's tested, and what hasn't been checked yet.";

const issues = 'https://github.com/ynotdraw/slab-elements/issues';

export const sections: Section[] = [
  {
    id: 'what-slab-does',
    heading: 'What Slab does',
    text: "Each element is built on the native element it corresponds to, so it gets that element's semantics from the platform instead of rebuilding them in ARIA. Slab adds what the platform doesn't have: keyboard and focus handling, ARIA where no native element fits, labels and descriptions wired to the right element, validation messages, and announcements for changes that aren't otherwise read out.",
  },
  {
    id: 'tested',
    heading: 'What every change is tested for',
    text: "Every change runs the whole suite in the latest Chromium, Firefox and WebKit. Axe checks every element for known violations. ARIA snapshot tests pin down each element's roles, names and states, so any change to them shows up in review. Keyboard tests cover what each element does with the keyboard, including in right-to-left layouts, and some elements also have tests for forced colors and reduced motion.",
  },
  {
    id: 'audited',
    heading: "What's been checked beyond that",
    text: "In October 2026, every element's semantics, keyboard support and announcements were audited, mostly by reading Chromium's accessibility tree, and everything found was fixed. That covered things like forced colors, right-to-left arrow keys, typing with an input method editor, validation messages and live announcements.",
  },
  {
    id: 'by-hand',
    heading: "What's been checked by hand",
    text: 'In November 2026, the 21 elements most likely to go wrong were walked through with VoiceOver on macOS in Chrome, step by step: the composite ones, like Combobox, Menu, Tree and Calendar, and the ones that announce changes, like Toast and Tags Input. The nine riskiest were also walked through in Safari: Combobox, Select, Listbox, Menu, Tree, Calendar, Command Palette, Slider and Range Slider. Most did what they should, and the gaps it found have been fixed. That was done to the best of our ability by people who build components, not by accessibility specialists or people who rely on a screen reader every day.',
  },
  {
    id: 'not-yet',
    heading: "What hasn't been checked yet",
    text: "The other 12 of those 21 haven't been checked in Safari yet. NVDA, JAWS and TalkBack haven't been tried, and neither have voice control or switch access. The rest, which lean more on their native elements, haven't been checked by hand. Automated tools catch only some problems, and screen readers differ from each other and from the accessibility tree a browser builds.",
  },
  {
    id: 'yours',
    heading: "What's up to you",
    text: "Slab is headless, so how an element looks is yours, and so is much of whether it's accessible: color contrast, a visible focus ring, target sizes, and text that says what a control does. Slab is a set of building blocks, so whether your app meets WCAG depends on how you use and style them.",
  },
  {
    id: 'report',
    heading: 'Tell us what you find',
    text: `If an element doesn't work with your assistive technology, please [open an issue](${issues}/new?template=accessibility.yml) with what you used and what you heard. Pull requests are welcome too.`,
  },
];
