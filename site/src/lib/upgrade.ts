// The guide to upgrading from 0.x to 1.0, in the same shape as Get started so
// the page and its Markdown twin share one renderer. Only changes that can
// break something are here. Everything else is in each release's notes.
import { type Section } from './get-started.ts';

export const title = 'Upgrade to 1.0';

export const summary =
  'Every change since 0.1 that can break something, and what to change for it.';

export const sections: Section[] = [
  {
    id: 'start',
    heading: 'Before you start',
    text: "Each section names the elements it touches and the release it came in. Skip any whose elements you don't use, and any from a release you're already past. After upgrading, run your type checker: most of these changes show up there first, as an unknown attribute, property or event.",
    code: {
      code: 'pnpm add slab-elements@^1.0.0',
      label: 'Terminal',
      lang: 'sh',
    },
  },
  {
    id: 'focus-rings',
    heading: 'Focus rings on Range Slider, Color Picker and Splitter',
    text: "From 0.2 and 0.3. Range Slider's and Color Picker's thumbs and Splitter's separator each hold a visually hidden range input, which is what's focused, so they no longer match `:focus-visible` themselves. Style the ring through the `focus-visible` part each one gains while its input has a visible focus.",
    code: {
      code: `/* Before */
slab-range-slider::part(start):focus-visible { outline: 2px solid; }

/* After. The same for Color Picker's hue-thumb and Splitter's separator. */
slab-range-slider::part(start focus-visible) { outline: 2px solid; }`,
      label: 'styles.css',
      lang: 'css',
    },
  },
  {
    id: 'toggle',
    heading: 'Tooltip and Hover Card\'s "toggle"',
    text: "Every element with `open` now dispatches \"toggle\" as a `ToggleEvent` with `oldState` and `newState`, the way a popover does. Like a popover's, it doesn't bubble and isn't composed. Tooltip and Hover Card's used to bubble, so a listener on an ancestor no longer hears them. Listen on the element itself.",
    code: {
      code: `// Before
document.addEventListener('toggle', onToggle);

// After
tooltip.addEventListener('toggle', (event) => {
  console.log(event.newState); // "open" or "closed"
});`,
      label: 'app.js',
      lang: 'js',
    },
    coda: 'Menu, Context Menu, Select and Combobox dispatch "toggle" too, for the first time, which needs no change.',
  },
  {
    id: 'grid-list',
    heading: "Grid List's selection",
    text: '`selection-mode` is gone. `selectable` makes rows selectable one at a time, and `multiple` makes them selectable more than one at a time, the same `multiple` as Listbox, Select, Combobox and Tree.',
    code: {
      code: `<!-- Before -->
<slab-grid-list label="Files" selection-mode="single"></slab-grid-list>
<slab-grid-list label="Files" selection-mode="multiple"></slab-grid-list>

<!-- After -->
<slab-grid-list label="Files" selectable></slab-grid-list>
<slab-grid-list label="Files" multiple></slab-grid-list>`,
      label: 'index.html',
      lang: 'html',
    },
  },
  {
    id: 'checkbox-group',
    heading: "Checkbox Group's values",
    text: "The list of checked values moves from `value` to `values`, as on Listbox, Select, Combobox, Tags Input and Toggle Group. `value` is now a string, the first checked value, and setting it checks only that Checkbox. What's submitted with a form doesn't change.",
    code: {
      code: `// Before
const checked = group.value; // ['forms', 'rebar']
group.value = ['forms'];

// After
const checked = group.values; // ['forms', 'rebar']
group.values = ['forms'];`,
      label: 'app.js',
      lang: 'js',
    },
  },
  {
    id: 'password-field',
    heading: 'Password Field\'s "reveal-change"',
    text: 'The show-and-hide button dispatches "reveal-change" instead of "toggle", since "toggle" is now the `ToggleEvent` of elements with `open`. Read `revealed` in the handler for whether the password shows.',
    code: {
      code: `// Before
field.addEventListener('toggle', onReveal);

// After
field.addEventListener('reveal-change', () => {
  console.log(field.revealed);
});`,
      label: 'app.js',
      lang: 'js',
    },
  },
  {
    id: 'toast',
    heading: 'Toast\'s "dismiss"',
    text: '"dismiss" can now be canceled to keep the toast shown, as Alert\'s can, so it\'s dispatched before the toast hides rather than after. In a listener, `open` is still `true`. Code that read `open` there to see that the toast had closed should wait for it instead, or drop the check.',
    code: {
      code: `toast.addEventListener('dismiss', (event) => {
  if (hasUnsavedChanges()) {
    event.preventDefault(); // It stays shown.
  }
});`,
      label: 'app.js',
      lang: 'js',
    },
  },
  {
    id: 'dialog-show',
    heading: 'Opening Dialog, Alert Dialog and Command Palette',
    text: "These now open the way a `<dialog>` does. `showModal()`, which is new, opens them as a modal. `show()` and setting `open` now open them non-modally: there's no backdrop, the rest of the page stays usable, and Escape only closes them with `closedby`. Where you set `open` for a modal, add `modal`, which makes `open` open it as a modal. That's also how a framework that binds `open` gets one. Where you called `show()` for a modal, call `showModal()`. Drawer opens non-modally as before, and takes `modal` and `showModal()` too.",
    code: {
      code: `<!-- Before -->
<slab-dialog label="Delete this file?" open>…</slab-dialog>

<!-- After -->
<slab-dialog label="Delete this file?" modal open>…</slab-dialog>`,
      label: 'index.html',
      lang: 'html',
    },
    coda: '`dialog.show()` for a modal becomes `dialog.showModal()`.',
  },
  {
    id: 'show-picker',
    heading: "Date Picker's and Date Range Picker's `showPicker()`",
    text: '`showPicker()` now throws as a native input\'s does: a "NotAllowedError" when it isn\'t called from a user gesture, such as a click or a key press, and an "InvalidStateError" while it\'s disabled or read-only. It used to open the calendar from anywhere, and do nothing while disabled. Call it from an event handler, or set `open` to open the calendar from code.',
    code: {
      code: `// Before
picker.showPicker();

// After, from code
picker.open = true;

// After, from a click
button.addEventListener('click', () => picker.showPicker());`,
      label: 'app.js',
      lang: 'js',
    },
  },
  {
    id: 'indeterminate',
    heading: "Checkbox's `indeterminate`",
    text: "`indeterminate` is now a property only, with no attribute, as on a native checkbox, and a form's reset leaves it as it is, as it does natively. Set the property from script, or bind it as a property in a framework, such as `.indeterminate` in Lit.",
    code: {
      code: `<!-- Before -->
<slab-checkbox label="Select all" indeterminate></slab-checkbox>

<!-- After -->
<slab-checkbox label="Select all"></slab-checkbox>
<script type="module">
  document.querySelector('slab-checkbox').indeterminate = true;
</script>`,
      label: 'index.html',
      lang: 'html',
    },
  },
  {
    id: 'subclasses',
    heading: 'Subclasses',
    text: "The protected hooks Slab's own styled subclasses override, such as Dialog's `renderContent()` and Date Field's `renderControl()`, and every element's `version`, are marked `@internal`. They're out of the published types, so a subclass that overrides a hook with `override` no longer type checks. They were never public API and can change in any release. Subclassing an element to set `styles` is public and keeps working.",
    coda: "What's public from 1.0, and what isn't, is in [What you can count on](get-started/#api).",
  },
];
