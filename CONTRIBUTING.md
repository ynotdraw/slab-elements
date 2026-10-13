# Contributing

Thanks for your interest in Slab. This document covers how to get the project
running, the conventions its code follows, and the reasoning behind a few
choices that tend to raise questions.

- [Getting started](#getting-started)
  - [Setup](#setup)
  - [Branching](#branching)
  - [Release notes](#release-notes)
  - [Text Slab generates](#text-slab-generates)
- [Component documentation](#component-documentation)
  - [Describing attributes](#describing-attributes)
  - [Describing slots](#describing-slots)
  - [Describing parts](#describing-parts)
  - [Making events discoverable](#making-events-discoverable)
- [Headless components](#headless-components)
  - [Only functional CSS](#only-functional-css)
  - [Expose `part`s and custom states](#expose-parts-and-custom-states)
  - [Nothing is final](#nothing-is-final)
  - [Don't style `:host`](#dont-style-host)
  - [Style slots rather than wrapping them](#style-slots-rather-than-wrapping-them)
- [TypeScript conventions](#typescript-conventions)
  - [Leave shadow roots open](#leave-shadow-roots-open)
  - [Use `#` for privacy](#use--for-privacy)
  - [Use refs, not `@query`](#use-refs-not-query)
  - [Let events bubble and compose](#let-events-bubble-and-compose)
  - [Reach for a plain `Event` first](#reach-for-a-plain-event-first)
  - [Name handlers `#onSomething`](#name-handlers-onsomething)
  - [Follow the platform](#follow-the-platform)
  - [Redeclare inherited properties used in templates](#redeclare-inherited-properties-used-in-templates)
  - [Where side effects go](#where-side-effects-go)
  - [Fail loudly on missing requirements](#fail-loudly-on-missing-requirements)
  - [Typing `@property`](#typing-property)
- [Testing conventions](#testing-conventions)
  - [Group with files, not `describe()`](#group-with-files-not-describe)
  - [Break long tests into steps](#break-long-tests-into-steps)
  - [ARIA tests](#aria-tests)
- [Storybook conventions](#storybook-conventions)
  - [Prefer controls to stories](#prefer-controls-to-stories)
  - [Set only the required attributes](#set-only-the-required-attributes)
  - [Skip controls for inherited members](#skip-controls-for-inherited-members)
  - [Re-check the style overrides after upgrading](#re-check-the-style-overrides-after-upgrading)
- [Notes](#notes)
  - [What is `per-env`?](#what-is-per-env)
  - [Why do Axe and ARIA snapshots both exist?](#why-do-axe-and-aria-snapshots-both-exist)
  - [Why is local coverage lower than CI's?](#why-is-local-coverage-lower-than-cis)
  - [Why isn't `custom-elements.json` published?](#why-isnt-custom-elementsjson-published)

## Getting started

### Setup

Slab uses pnpm. [Corepack](https://pnpm.io/installation#using-corepack) is the
easiest way to get the right version.

```bash
pnpm install
pnpm start
```

`pnpm start` builds the elements manifest, runs the code generators, and serves
Storybook on port 6006.

If your `~/.npmrc` sets `ignore-scripts=true`, run `pnpm prepare` as well so the
Git hooks and Playwright's browsers get installed.

CI runs format, lint, typecheck and the Playwright suites on every pull
request. To catch failures before pushing, run the same checks yourself:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

### Branching

With write access, branch off `main`. Otherwise
[fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo)
the repository and open a pull request from your fork.

### Release notes

Releases run on [Changesets](https://github.com/changesets/changesets). If your
change is something a consumer would want to know about, add a changeset to your
pull request:

```bash
pnpm changeset
```

Pick the bump type that matches your change under
[semantic versioning](https://semver.org), then describe the change the way a
consumer reading the changelog would want it described — what changed and what
they need to do about it, not how you implemented it.

### Text Slab generates

Consumers supply the text Slab renders, and translate it. Slab doesn't localize
anything itself. Where a component has to generate text, mostly accessible
names for screenreaders, give it an attribute the consumer can set and default
it to English when unset, as Alert's `dismiss-label` does:

```ts
/**
 * The dismiss button's text and so its accessible name. "Dismiss" when unset.
 */
@property({ attribute: 'dismiss-label', reflect: true })
dismissLabel?: string;
```

Text that's built from a value, such as Pagination's "Page 3", is a function
property instead, so a consumer can word it, and order it, for their language.

## Component documentation

Each component's JSDoc comment is generated from
[`custom-elements.json`](custom-elements.json) and written into the source file
by `pnpm start`. Don't write these comments by hand — they get overwritten. What
you write instead is the input the generator reads.

### Describing attributes

Put a comment above the property:

```ts
/**
 * Description
 **/
@property({ reflect: true })
label?: string;
```

### Describing slots

Put a comment inside the slot. Add `@required` if the slot has to be filled:

```html
<slot>
  <!--
    Description
    @required
  -->
</slot>
```

### Describing parts

Put a comment inside the element with the `part`, as for a slot. A part bound
with an expression can't be read from the markup, so name each one it can be
with a `@part` tag instead:

```html
<td part="${parts}">
  <!--
    A day of the month
    @part selected - The selected day
  -->
</td>
```

### Making events discoverable

The [analyzer](src/cem-analyzer-plugins/add-events.ts) finds events by looking
for `dispatchEvent` calls. An event that a native element dispatches on your
behalf is invisible to it, so stop that event and dispatch your own:

```ts
#onInput(event: Event) {
  event.stopPropagation();
  this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}
```

Leave a comment saying why, so the next reader doesn't take the redispatch for
an accident.

## Headless components

Slab ships behavior and nothing about how it looks. A component carries no
visual styles: no colors, no type, no spacing, no size. What it carries is
keyboard and focus handling, ARIA, form participation, and events.

Build each component on the native element it corresponds to, so it inherits
that element's semantics, form participation, and platform behavior rather than
reimplementing them in ARIA. Reach for a role only where the platform has no
element for the job — `[role=tablist]`, `[role=toolbar]`, `[role=tooltip]`.

### Only functional CSS

The one kind of CSS a component may carry is functional: CSS without which the
component doesn't work. A label hidden with `hide-label` still has to name its
control, so it's hidden visually rather than removed. That's functional. A
border, a color, a font, a size: those are a design's to make.

Functional styles go in `finalizeStyles()` rather than in `styles`, so a
subclass that sets its own `styles` keeps them:

```ts
protected static override finalizeStyles(
  subclassStyles?: CSSResultGroup,
): CSSResultOrNative[] {
  return super.finalizeStyles([styles, subclassStyles ?? []]);
}
```

### Expose `part`s and custom states

A [`part`](https://developer.mozilla.org/en-US/docs/Web/CSS/::part) and a
[custom state](https://developer.mozilla.org/en-US/docs/Web/API/CustomStateSet)
are how a consumer reaches in. Name every element a design needs to style, and
set a state for every condition it needs to react to:

```ts
// ✅
override render() {
  return html`<span part="checkbox"></span>`;
}
```

Set state through `ElementInternals` so it's selected as `:state(checked)`
rather than as an attribute a consumer might set themselves.

Shadow roots are open, so a `part` isn't the only way in — but it's the way
that keeps working. `slab/no-private-selectors` holds each component's own CSS
to selectors a consumer could write too: if the component styles something, a
consumer can restyle it.

### Nothing is final

With no styles of its own, a component is restyled by subclassing it: a
consumer extends the class, sets `styles`, and registers the subclass under a
tag of their own. So no component is decorated with `@final`, and group
components find their members by class rather than by tag name, so a renamed
subclass still counts.

### Prefer progressive enhancement

When the platform can do something in some browsers and not yet in others, use
it where it's supported and let the rest do what the platform does without it.
Don't write JavaScript to fill the gap. The gap closes on its own as browsers
catch up, and the JavaScript is left behind, to be maintained and to disagree
with the platform once it arrives.

Slab already works this way:

- Dialog passes `closedby` through to its `<dialog>`. Where light dismiss isn't
  supported, a click on the backdrop does nothing, rather than being faked
  with a click listener.
- Tooltip, Popover, Menu and Select position with CSS anchor positioning.
  Where it isn't supported, the browser centers the popover.
- The styled Accordion animates opening and closing with `calc-size()`. Where
  that isn't supported, which is Firefox and Safari today, a Disclosure opens
  and closes at once, as a `<details>` does.

What's left without the feature has to work. That's the line: an animation, a
convenience or a nicer position can be missing, but the component still opens,
closes, submits and is announced in every supported browser.

## TypeScript conventions

### Leave shadow roots open

`LitElement` opens its shadow root, and Slab leaves it that way.

Closing it was the right call for a styled library, where the shadow root held
a design that consumers had no business reaching into. It isn't the right call
here. A headless component's internals are exactly what a consumer is working
with: they're styling it, they're reading its structure to understand it, and
when a `part` doesn't reach far enough they need somewhere to go that isn't
"fork it".

That does mean an internal rename can break someone who reached past the
documented surface. The answer is to make the documented surface good enough
that they don't have to: name a `part` for every element a design needs, and
set a custom state for every condition it reacts to. `slab/no-private-selectors`
holds the component's own CSS to the same selectors, so anything the component
styles, a consumer can restyle.

### Use `#` for privacy

TypeScript's `private` disappears at compile time. JavaScript's `#` is private
at runtime, which is the property that actually keeps consumers off your
internals:

```ts
// ✅
#onInputChange() {}

override render() {
  return html`<input @change=${this.#onInputChange} />`;
}
```

```ts
// ❌
private onInputChange() {}

override render() {
  return html`<input @change=${this.onInputChange} />`;
}
```

Lit's `@state()` decorator can't see `#` fields, so that one case has to use
`private`:

```ts
// ✅
@state()
private open = false;
```

### Use refs, not `@query`

Prefer [refs](https://lit.dev/docs/templates/directives/#ref) over `@query` and
`@queryAll`. Refs can be private;
[decorators can't](https://github.com/lit/lit/issues/4020#issuecomment-1743735312),
so a `@query` is one more thing a consumer can reach.

Refs only cover the shadow root. For light DOM, use `this.querySelector`, and
for the contents of a particular slot use
[`assignedElements()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/assignedElements).

### Let events bubble and compose

Bubbling is what people expect, and it's what makes
[event delegation](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_delegation)
possible. `composed` is what gets the event out of the shadow root at all:

```ts
// ✅
this.dispatchEvent(new Event('selected', { bubbles: true, composed: true }));
```

```ts
// ❌
this.dispatchEvent(new Event('selected'));
```

### Reach for a plain `Event` first

A `CustomEvent` is usually carrying something the consumer could already get. If
the value is on the component, they can read it there. If it's an element,
dispatch from that element and let them use `event.target`. Use `CustomEvent`
when the payload genuinely exists nowhere else.

### Name handlers `#onSomething`

```ts
// ✅
#onClick(event: MouseEvent) {}
```

```ts
// ❌
#handleClick(event: MouseEvent) {}
```

### Follow the platform

Slab's components sit alongside `<input>` and `<button>` in consumers' markup,
so they should behave like them.

Attribute reflection is the usual example. Reflect attributes by default, but
not ones that represent an initial value — `<input>` doesn't reflect `value`,
and neither should you:

```ts
// ✅
@property({ reflect: true })
label?: string;

@property()
value = '';
```

```ts
// ❌
@property({ reflect: true })
value = '';
```

### Redeclare inherited properties used in templates

Properties inherited from `Element` and `HTMLElement` aren't reactive. A
consumer setting one still works, because Lit picks it up through
`attributeChangedCallback`. Setting one internally — from a click handler, say —
won't re-render.

Plenty of components never change these internally and so never hit the bug.
They hit it later, when someone adds the code that does. Override and decorate
inherited properties you use in a template, whether or not you currently change
them.

### Where side effects go

Each kind of change has a place, in this order of preference:

1. **Derive it.** A value that can be computed from children or other
   properties is a getter that stores nothing. Tabs' `selectedTab` reads the
   Tabs rather than tracking which one is selected, so there's nothing to keep
   in step.
2. **Mirror a component's own state in `updated()`.** ARIA attributes,
   `:state()`s and private events that follow a property go there, as Option,
   Radio and Tab do. It runs once per update with the final state, so the order
   attributes arrive in doesn't matter, and a few properties set together cost
   one pass. The trade-off is that it runs a microtask after the property is
   set.
3. **Use a setter only when the consumer must see the effect synchronously**,
   such as Listbox's `value` selecting its Option, which reads back straight
   away. Keep it thin and hand off to the method the user's path uses. A setter
   runs during attribute initialization, before render and often before the
   children exist, and Radio Group's `#isSettingValue` and `#hasSettled` are
   what working around that costs.
4. **Coordinate children through `slotchange` and the `private-*` events** a
   child dispatches from its own `updated()`. They're the only way to hear a
   child arrive, upgrade late or change, so don't poll children from the
   parent's `updated()`.

### Fail loudly on missing requirements

Bad state that propagates quietly is expensive to track down later. Assert at
the boundary.

For properties the component can't work without:

```ts
import required from './library/required.js';

@property()
@required
label?: string;
```

For slots:

```ts
import assertSlot from './library/assert-slot.js';

override render() {
  return html`<slot ${assertSlot([HTMLButtonElement])}></slot>`;
}
```

### Typing `@property`

The repository runs TypeScript's
[`strict`](https://www.typescriptlang.org/tsconfig#strict) flag, which includes
[`strictPropertyInitialization`](https://www.typescriptlang.org/tsconfig#strictPropertyInitialization).
Decorated properties without a default trip it:

```
Property [...] has no initializer and is not definitely assigned in the constructor.ts(2564)
```

Type the property as optional rather than reaching for the non-null assertion
operator. A property can be read before it's set, and `!` only hides that:

```ts
@property()
label?: string;
```

This applies to required properties too. `@required` throws at runtime, but the
property is genuinely undefined earlier in the lifecycle, and the type should
say so.

## Testing conventions

### Group with files, not `describe()`

A filename tells you what's inside it from the sidebar. A `describe()` block
makes you open the file first:

```bash
# ✅
src/checkbox.test.miscellaneous.ts
```

```js
// ❌
describe('Checkbox Miscellaneous', () => {});
```

The suffix says what kind of test it is:

| File                      | Contents                                                                  |
| ------------------------- | ------------------------------------------------------------------------- |
| `*.test.accessibility.ts` | `toBeAccessible()` and other accessibility assertions                     |
| `*.test.forms.ts`         | `value`, `checkValidity()`, `reportValidity()` — anything with a `<form>` |
| `*.test.keyboard.ts`      | State and events after keyboard interaction                               |
| `*.test.mouse.ts`         | State and events after mouse interaction                                  |
| `*.test.miscellaneous.ts` | Everything else                                                           |

### Break long tests into steps

Some tests are unavoidably long. Wrap the phases in
[`test.step()`](https://playwright.dev/docs/api/class-test#test-step) so a
failure report points at the phase that broke instead of the whole test.

### ARIA tests

An ARIA test asserts against a component's
[accessibility tree](https://developer.mozilla.org/en-US/docs/Glossary/Accessibility_tree)
serialized as YAML. Snapshots live inline in the test file via
`toMatchAriaSnapshot`, so a change to the tree shows up as a diff in review.

Every component should have a suite of these.
`src/checkbox.test.accessibility.ts` is a good one to read first. With no
visual layer to check, these and Axe are the primary signal that a component
does what it claims.

Tests run against individual stories. Work down the component's controls table
in Storybook and write a test for each optional attribute that affects
accessibility. Required attributes don't need their own tests — the stories set
them, so the optional-attribute tests cover them.

## Storybook conventions

### Prefer controls to stories

Stories cost something to write and more to maintain, and a long sidebar is
harder to navigate than a short one. Write a story only for a state a control
can't reach — an optional slot that needs particular markup, or an error state
that only appears after a form submission.

### Set only the required attributes

Stories double as copy-paste examples. Giving every attribute a value teaches
people to copy more than they need, so set the required ones and leave the rest
to controls.

### Skip controls for inherited members

Components extend `LitElement`, so everything on `HTMLElement` and `Element` is
available and can be assumed. Documenting all of it would bury the parts that
are actually specific to the component.

Two things are worth documenting anyway. `addEventListener()`, when the
component dispatches events you wouldn't guess — `"change"`, `"input"`,
`"toggle"`. And `value` on form controls, because people check it in DevTools;
without a `value` on each Checkbox, Checkbox Group reads back empty and looks
broken.

### Re-check the style overrides after upgrading

Slab [overrides](.storybook/overrides.css) a number of Storybook's internal
styles, which Storybook
[explicitly doesn't](https://storybook.js.org/docs/configure/user-interface/theming#css-escape-hatches)
promise to keep stable. After a Storybook upgrade, check the overrides still
hold — in both light and dark mode.

## Notes

### What is `per-env`?

[`per-env`](https://github.com/ericclemmons/per-env) picks a `package.json`
script based on `NODE_ENV`, so `pnpm lint` means something different locally
than it does in CI without CI needing to know the script names.

The split is consistent: `*:development:*` scripts are long-running (`--watch`,
`--serve`) and will modify your files (`--fix`, `--write`); `*:production:*`
scripts do neither and are safe to run in CI.

### Why do Axe and ARIA snapshots both exist?

Axe answers "is this accessibility tree valid and free of known violations?"
That's necessary but not sufficient — it can't tell you the tree is _correct_.
An open Dropdown that never reports itself as expanded has a perfectly valid
tree, and Axe passes it.

Snapshots close that gap by pinning the tree itself. If it doesn't change across
a refactor, the component is very likely as accessible as it was before, which
makes changes much safer to land.

Neither replaces testing with an actual screenreader, since nothing guarantees a
screenreader interprets the tree the way you'd expect. Together they cut down
how often you need to.

### Why is local coverage lower than CI's?

Coverage reflects whichever tests ran. Running one test in Playwright's UI
produces a report covering that one test. For a total, run the whole
`functionality` project:

```bash
pnpm test:production:playwright
```

### Why isn't `custom-elements.json` published?

Because nothing appears to consume it. The manifest is widely recommended for
tooling, but the tooling largely isn't there yet.

VS Code's Lit plugin nominally supports it through
[`customHtmlData`](https://github.com/runem/lit-analyzer/tree/master/packages/vscode-lit-plugin#-configuration),
but the option takes no file path and a
[bug](https://github.com/runem/lit-analyzer/issues/300) requires pasting the
whole manifest inline. Even then attributes show up duplicated on hover and some
don't show at all.

If a real use case turns up, publishing it is easy enough.
