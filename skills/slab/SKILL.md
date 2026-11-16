---
name: slab
description: Build UI with Slab (the slab-elements package), headless Web Components with keyboard, focus, ARIA and form support on native elements. Use when a project depends on slab-elements, when code uses `<slab-*>` tags or imports from `slab-elements/*.js`, or when asked for accessible, unstyled components that work in any framework.
---

# Slab

Slab is a headless Web Component library, published as `slab-elements`. Each element handles keyboard and focus, ARIA, form participation and events on top of the native element it maps to. It ships no visual styles. You style it from outside with `::part()` and `:state()`, or subclass it.

The most common mistake is to guess a React-style API: `onChange` props, `isOpen`, `selectedKey`, controlled values, render props. Slab has none of that. **It works like a native element.** If you know what `<input>`, `<dialog>` and `[popover]` do, assume Slab does the same, then check the component's reference.

## Before you write code

1. Pick the component from the index at the bottom of this file. Each row's "Built on" says which native element or ARIA role it is.
2. Read its reference in `references/<component>.md`. It has the import, the usage, the keyboard, the behavior and the full API: attributes, properties, methods, events, slots, CSS parts and CSS states. It's generated from the package's own manifest, so trust it over memory. Never invent an attribute, event, part or state that isn't listed there.
3. Write markup first, then wire behavior with properties, methods and events the way you would a native element.

## Install and import

```sh
pnpm add slab-elements lit
```

`lit` is a peer dependency. Each element is its own module, and importing it registers its tag. Import exactly the modules you use. An element made of parts has a module per part, and each part must be imported too:

```js
import 'slab-elements/tabs.js';
import 'slab-elements/tabs.tab.js';
import 'slab-elements/tabs.panel.js';

import 'slab-elements/select.js';
import 'slab-elements/option.js'; // <slab-option>, shared by Select, Combobox, Listbox and Command Palette
```

The package exports only `slab-elements/<module>.js`, `slab-elements/custom-elements.json` and `slab-elements/package.json`. There's no barrel or default import of everything, and `slab-elements/library/*` is private.

## Native conventions

These hold for every element. Follow them rather than habits from React component libraries.

- **Attributes in, events out.** Configure with attributes in markup and properties in script. Listen with `addEventListener` for the native event names: `input`, `change`, `toggle`, `beforetoggle`, `cancel`, `close`, `invalid`, plus a few of Slab's own, like Copy Button's `copy-error`. Each component's reference lists them.
- **Events from code are quiet.** Like native controls, `input` and `change` fire only for user changes. Setting `value` or `checked` from code dispatches nothing.
- **Attribute is the default, property is the current state.** As on `<input>`, the `checked` and `value` attributes are where a control starts, and the properties are where it is now. Toggling a Checkbox doesn't change its `checked` attribute, so read `element.checked` and style `:state(checked)`, never `[checked]`.
- **Every control needs a name.** Give it `label`. An element that needs one and has none throws, rather than going unnamed. To hide the label visually and keep it for screen readers, add `hide-label`. Don't put `aria-label` or `aria-labelledby` on the host instead, since they don't reach the control inside in every browser.
- **Open and close the native way.** Anything with `open` reflects it, dispatches a `ToggleEvent` named `toggle` (with `oldState` and `newState`, and not bubbling, like a popover's) and matches `:state(open)`. Popups such as Popover, Menu, Select, Combobox, Tooltip and Hover Card have `show()` and `hide()`, as a popover does, and dispatch a cancelable `beforetoggle` first. Popover and Navigation Menu Item also have `toggle(force?)`. Check the reference before calling a method.
- **Dialogs are `<dialog>`.** `showModal()` opens Dialog, Alert Dialog, Drawer and Command Palette as a modal. `show()` or setting `open` opens a non-modal one, as on `<dialog>`. Add Slab's `modal` attribute when `open` is bound declaratively (as a framework does) and you want a modal. `close(returnValue)`, `requestClose()`, `<form method="dialog">` and the `cancel` and `close` events work as natively.
- **Choices are `multiple` and `values`.** Listbox, Select, Combobox, Tree, Tags Input, Toggle Group and Checkbox Group take `multiple`. `values` is the array, and `value` is the first of them.
- **Numbers match the native element.** Meter and Progress take numbers. Slider and Number take strings, like `<input type=range>`, and add `valueAsNumber`.
- **`readonly` only where native has it**: fields that take typing, Combobox, Tags Input and Rating. Checkbox, Select and Slider don't have it.
- **Toggle buttons aren't form controls.** For a set of choices in a form, use Checkbox Group or Radio Group, not Toggle Group.

## Forms

Slab's controls are form-associated, so they behave like `<input>` in a plain `<form>`: they submit `name` and `value`, reset with the form and restore with the page. There's no form library to wire up and no hidden inputs to add.

```html
<form>
  <slab-text-field
    label="Email"
    name="email"
    type="email"
    required
  ></slab-text-field>
  <slab-checkbox
    label="Send me updates"
    name="updates"
    value="yes"
  ></slab-checkbox>
  <button>Sign up</button>
</form>
```

- Validation is native: `required`, `pattern`, `min`, `max`, `minlength` and the rest mean what they mean on `<input>`. Use `checkValidity()`, `reportValidity()`, `setCustomValidity()`, `validity` and `validationMessage` as you would natively. `setCustomValidity('')` clears only the custom error.
- An invalid control fires `invalid`. Cancel it to keep the validity message hidden. Style the error with `:state(error)`, which matches once validity has been reported, and the `validity-message` part.
- Put hints in the `description` slot: `<span slot="description">8 characters or more</span>`. It becomes the accessible description.
- `new FormData(form)` and `value` are current inside `input` and `change` listeners.
- `<slab-form>` is optional, for when the form itself should be a Slab element. To give a native control Slab's label, description and validity wiring, wrap it in `<slab-field>`.

## Styling

Nothing ships styled, so an element has no size and nothing to see until you style it. Reach its insides only through the parts and states its reference lists:

```css
slab-checkbox::part(checkbox) {
  block-size: 1rem;
  border: 1px solid currentcolor;
  inline-size: 1rem;
}

slab-checkbox:state(checked)::part(checkbox) {
  background-color: currentcolor;
}
```

- Use `::part(name)` and `:state(name)`. Classes and selectors can't reach into the shadow root, so utility classes style only the host and what you slot in.
- Prefer `:state(open)`, `:state(disabled)` and the rest over attribute selectors, since state can change without the attribute.
- Hold space or hide slotted content until the element is defined with `:not(:defined)`.
- To make a design-system component, subclass the element, set `static styles`, and register it under your own tag. Slab's functional styles, like a visually hidden label, survive yours:

```js
import Checkbox from 'slab-elements/checkbox.js';
import { css } from 'lit';

customElements.define(
  'acme-checkbox',
  class extends Checkbox {
    static styles = css`
      [part~='checkbox'] {
        block-size: 1rem;
      }
    `;
  },
);
```

Each component's docs page (linked from its reference) has a styled example, `<slab-styled-*>`, to copy. Those styled tags aren't in the package. Don't import or use them.

## Frameworks

There's no wrapper package. The tag is the component in React, Vue, Svelte, Angular, server templates and plain HTML.

- **React 19** sets properties and listens for events with `on` plus the exact event name, lowercase: `onchange`, `ontoggle`, `oncopy-error`. Not `onChange`. Before React 19, use a ref and `addEventListener`.
- **Vue** needs `compilerOptions.isCustomElement: (tag) => tag.startsWith('slab-')` in its Vue plugin config. Listen with `@change`, `@toggle` and so on.
- **Svelte 5** listens with `onchange`. Don't wrap an element with `slot="…"` children in a Svelte component, since Svelte would take the slot.
- **Server rendering** (Next.js, Nuxt, SvelteKit, Astro): importing an element on the server is safe, but it doesn't render there. The element upgrades in the browser once its module loads, so the import must reach the client. In React Server Components, import it from a `'use client'` module.
- **TypeScript**: each module adds its tag to `HTMLElementTagNameMap`. For typed templates, add one of these once: `import type {} from 'slab-elements/react.js';`, `'slab-elements/vue.js'` or `'slab-elements/svelte.js'`. Other frameworks can use `SlabElementProps` and `SlabElementEvents` from `slab-elements/jsx.js`.

## Words and languages

Where an element makes its own text, mostly names for screen readers, it's English until translated. Register strings once per language, and elements use them by their nearest `lang`:

```js
import { registerStrings } from 'slab-elements/strings.js';

registerStrings('de', {
  alertDismiss: 'Schließen',
  paginationPage: (page) => `Seite ${page}`,
});
```

The `Strings` type lists every key. An attribute on the element, like Alert's `dismiss-label`, wins over registered strings.

## Accessibility

Slab does the ARIA, focus and keyboard for you, following the ARIA Authoring Practices Guide. Don't add `role`, `tabindex` or `aria-*` to Slab elements to "fix" them, and don't reimplement keyboard handling. Your part is:

- A `label` on every control, Tabs, Menu and other named widget, even when it's hidden with `hide-label`.
- Real, focusable content in slots: a `<button slot="anchor">` for Popover, Menu and Tooltip, not a `<div>`.
- Headings you choose. Dialog's `label` isn't a heading, so slot your own, such as `<h2 slot="label">`, at the right level.
- Visible focus styles through the parts, since nothing ships styled.
- Tooltips for short, supplementary text only. Use Hover Card or Popover for anything interactive.

## Testing

Test Slab in a real browser: Playwright, Cypress, WebdriverIO or Vitest's browser mode. jsdom and happy-dom lack popovers, form association and custom states, so Slab elements can't render there. Query them as you would native ones. Playwright's `getByRole` and `getByLabel` reach through shadow roots, so `page.getByRole('switch', { name: 'Notifications' })` finds a Switch. Then assert on properties like `checked` and `value`, and on events.

## Browsers

Chrome and Edge 125, Firefox 126 and Safari 17.4 or newer. Don't add polyfills for popovers or custom states.

## Components

<!-- components:start -->

<!-- Generated by src/build/skill.ts. Edit the components' pages in site/src/content/components, not this. -->

### Overlays

- [Alert](references/alert.md): `slab-alert`, built on `[role=alert]`. An inline message that gets announced when it shows up. Put it on the page empty, then fill it in when there's something to say.
- [Alert Dialog](references/alert-dialog.md): `slab-alert-dialog`, built on `<dialog role=alertdialog>`. A modal dialog that asks before something can't be undone. Focus starts on Cancel, and a click outside doesn't close it.
- [Command Palette](references/command-palette.md): `slab-command-palette`, built on `<dialog> + <input role=combobox>`. A search for commands, opened as a modal with `showModal()`: type to filter a list of Options, then Enter runs the best match. It's a Combobox in a Dialog.
- [Dialog](references/dialog.md): `slab-dialog`, built on `<dialog>`. A dialog built on the native `<dialog>`, modal or not. A modal one keeps focus inside, closes on Escape, and makes the rest of the page inert — the platform does the heavy lifting.
- [Drawer](references/drawer.md): `slab-drawer`, built on `<dialog>`. A dialog for a side panel. Non-modal by default, so the page behind it stays usable, or modal through `showModal()`.
- [Hover Card](references/hover-card.md): `slab-hover-card`, built on `[popover]`. A preview of what a link leads to, shown beside it on hover and keyboard focus, with room for links and buttons of its own.
- [Popover](references/popover.md): `slab-popover`, built on `[popover]`. Content that pops up beside the element that opened it, in the top layer, and gets dismissed the way a native popover does.
- [Toast](references/toast.md): `slab-toast`, built on `[role=status]`. A polite heads-up that something just happened. It lives on the page up front, so screen readers actually hear it.
- [Tooltip](references/tooltip.md): `slab-tooltip`, built on `[role=tooltip]`. A short description that shows up beside an element on hover and focus.

### Disclosure

- [Accordion](references/accordion.md): `slab-accordion`, built on `group of <details>`. A group of Disclosures where opening one can close the others. Great for FAQs.
- [Carousel](references/carousel.md): `slab-carousel`, built on `CSS scroll snap + <button>s`. Slides one after another that swipe and snap with CSS, with Previous, Next and a marker per slide.
- [Disclosure](references/disclosure.md): `slab-disclosure`, built on `<details>`. Show and hide content behind a summary. It's a native `<details>` with a few extras.
- [Splitter](references/splitter.md): `slab-splitter`, built on `<input type=range>`. Two panes with a separator between them that resizes them, dragged or moved with the keyboard.

### Navigation

- [Breadcrumb](references/breadcrumb.md): `slab-breadcrumb`, built on `<nav> + <ol>`. The trail of links to the current page, as an ordered list in a navigation landmark. Separators are yours to add.
- [Context Menu](references/context-menu.md): `slab-context-menu`, `slab-menu-item`, built on `[role=menu] + [popover]`. Menu's Menu Items, opened where the user right-clicks or long-presses, or from the keyboard, in place of the browser's own menu.
- [Menu](references/menu.md): `slab-menu`, `slab-menu-item`, `slab-menu-group`, built on `[role=menu] + [popover]`. A button that opens a list of actions. It's the APG's menu button, keyboard and all.
- [Menubar](references/menubar.md): `slab-menubar`, built on `[role=menubar]`. A row of Menus, such as File, Edit and View, with the arrow keys to move between them. It's the APG's menubar.
- [Navigation Menu](references/navigation-menu.md): `slab-navigation-menu`, `slab-navigation-menu-item`, built on `<nav> + <button aria-expanded>`. A site's navigation: links, plus buttons that show and hide links of their own. It's the APG's disclosure navigation, not a menu.
- [Pagination](references/pagination.md): `slab-pagination`, built on `<nav> + <button>s`. Buttons for moving between pages, with an ellipsis for the ones it doesn't show.
- [Steps](references/steps.md): `slab-steps`, `slab-steps-step`, built on `<ol> + aria-current="step"`. Where the user is in a task of several steps, such as a checkout or a setup wizard, as a numbered list. Steps can be buttons that go back.
- [Tabs](references/tabs.md): `slab-tabs`, `slab-tabs-tab`, `slab-tabs-panel`, built on `[role=tablist]`. Tabs and their Panels, with one Panel showing at a time.
- [Toolbar](references/toolbar.md): `slab-toolbar`, built on `[role=toolbar]`. A group of controls that Tab reaches once, with the arrow keys to move between them.
- [Tree](references/tree.md): `slab-tree`, `slab-tree-item`, built on `[role=tree]`. A nested list of items that expand and collapse, to pick one or more from.

### Selection

- [Combobox](references/combobox.md): `slab-combobox`, built on `<input role=combobox>`. A text input that filters a list of Options as you type, to pick one or, with `multiple`, several as removable tags.
- [Listbox](references/listbox.md): `slab-listbox`, `slab-option`, `slab-option-group`, built on `[role=listbox]`. A list of Options to pick one or more from, right on the page instead of in a popup.
- [Select](references/select.md): `slab-select`, built on `[role=combobox] + [role=listbox]`. A button that opens a list of Options to pick one or more from. It submits just like a `<select>`.
- [Toggle Button](references/toggle-button.md): `slab-toggle-button`, built on `<button aria-pressed>`. One button that stays pressed until it's pressed again, for a setting that's on or off.
- [Toggle Group](references/toggle-group.md): `slab-toggle-group`, `slab-toggle-group-button`, built on `[role=group]`. A row of toggle buttons that Tab reaches once, with one pressed at a time or several.

### Form

- [Checkbox](references/checkbox.md): `slab-checkbox`, built on `<input type=checkbox>`. A checkbox built on the native one, with an indeterminate state and real form validation.
- [Checkbox Group](references/checkbox-group.md): `slab-checkbox-group`, built on `[role=group]`. A set of Checkboxes with one label, one value, and one validity between them.
- [Color Picker](references/color-picker.md): `slab-color-picker`, built on `<input type=range>`. A color picker with a saturation and brightness area, hue and alpha sliders, a hex field and swatches.
- [Copy Button](references/copy-button.md): `slab-copy-button`, built on `<button>`. Copy text to the clipboard with a button, and say so once it has.
- [Date Field](references/date-field.md): `slab-date-field`, built on `<input type=date>`. A date field built on the native date input. The browser brings its own picker.
- [Date Picker](references/date-picker.md): `slab-date-picker`, built on `<input type=date>`. A Date Field with a button that opens a Calendar in a popover, so the picker is the same in every browser and yours to style.
- [Date Range Field](references/date-range-field.md): `slab-date-range-field`, built on `<input type=date>`. A start and an end date, each on the native date input, linked so the end is never before the start.
- [Date Range Picker](references/date-range-picker.md): `slab-date-range-picker`, built on `<input type=date>`. A Date Range Field with a button that opens a range Calendar in a popover, so both days are picked in one calendar that looks the same in every browser.
- [Editable](references/editable.md): `slab-editable`, built on `<button> + <input>`. Text that is edited in place, such as a title or a name: a button showing the value that becomes an input when pressed.
- [Field](references/field.md): `slab-field`, built on `<label>`. A label wired up to a control of your own. Bring any input, select, or element you like.
- [File Drop](references/file-drop.md): `slab-file-drop`, built on `<input type=file>`. A file input you can also drop files onto. One list of files, either way.
- [Form](references/form.md): `slab-form`, built on `<form>`. A `<form>` that Slab's controls submit, reset, and validate with — just like native ones.
- [Number](references/number.md): `slab-number`, built on `<input type=number>`. A number field built on the native one, with stepping and validation included.
- [Password Field](references/password-field.md): `slab-password-field`, built on `<input type=password>`. A password input with a button that shows and hides what was typed.
- [Pin Input](references/pin-input.md): `slab-pin-input`, built on `<input>`. A PIN or one-time code field: a row of native inputs, one per character, that submits as one value.
- [Radio Group](references/radio-group.md): `slab-radio-group`, `slab-radio-group-radio`, built on `[role=radiogroup]`. A set of Radios with one label, one value, and exactly one checked.
- [Range Slider](references/range-slider.md): `slab-range-slider`, built on `<input type=range>`. A two-thumb slider for picking a range, with a thumb at each end that can meet but not pass the other.
- [Rating](references/rating.md): `slab-rating`, built on `[role=radiogroup] + <input type=radio>s`. A row of native radios from 1 to `max`, with one label and one value, that previews the value under the pointer.
- [Search Field](references/search-field.md): `slab-search-field`, built on `<input type=search>`. A search input with a button that clears it, and Escape that does the same.
- [Slider](references/slider.md): `slab-slider`, built on `<input type=range>`. A single-thumb slider built on the native range input.
- [Switch](references/switch.md): `slab-switch`, built on `<input type=checkbox role=switch>`. An on and off toggle built on a native checkbox with the switch role.
- [Tags Input](references/tags-input.md): `slab-tags-input`, built on `<input> + <button>s`. A text input that turns what you type into removable tags, for values with no list to pick from, submitted one entry per tag.
- [Text Field](references/text-field.md): `slab-text-field`, built on `<input>`. A single-line text field built on the native input, validation and all.
- [Textarea](references/textarea.md): `slab-textarea`, built on `<textarea>`. A multi-line text field built on the native textarea.
- [Time Field](references/time-field.md): `slab-time-field`, built on `<input type=time>`. A time field built on the native time input. The browser shows a 12- or 24-hour clock for the locale.

### Data

- [Calendar](references/calendar.md): `slab-calendar`, built on `<table role=grid>`. A month of days to pick from, or with `range`, a range of them. It's the grid from the APG's date picker, with all the keyboard support you'd expect.
- [Feed](references/feed.md): `slab-feed`, built on `[role=feed] + <article>s`. A list of articles that grows as the user scrolls, like a timeline. Page Down and Page Up move between articles, and a screenreader hears where each one is.
- [Grid List](references/grid-list.md): `slab-grid-list`, `slab-grid-list-item`, built on `[role=grid] + rows`. A list of rows that can hold their own buttons, links and checkboxes, moved through with the arrow keys and optionally selected.
- [Meter](references/meter.md): `slab-meter`, built on `<meter>`. A measurement in a known range, like disk usage. It tells you which region the value's in, so your design can show it.
- [Progress](references/progress.md): `slab-progress`, built on `<progress>`. How far along a task is, or just that it's happening when you don't know yet. That's your spinner, too.
- [Sortable List](references/sortable-list.md): `slab-sortable-list`, `slab-sortable-list-item`, built on `[role=list] + handle <button>s`. A list the user puts in order, by dragging each item by its handle or with the keyboard, while a screenreader hears where the item is as it moves.
- [Table](references/table.md): `slab-table`, `slab-table-head`, `slab-table-body`, `slab-table-foot`, `slab-table-row`, `slab-table-column-header`, `slab-table-cell`, built on `[role=table] + rowgroups, rows and cells`. Rows and columns, laid out and announced like a native table, that components can render into. Column headers can be buttons that sort.

<!-- components:end -->
