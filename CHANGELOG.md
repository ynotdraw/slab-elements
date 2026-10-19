# slab-elements

## 0.1.2

### Patch Changes

- [#11](https://github.com/ynotdraw/slab-elements/pull/11) [`e5b3ee2`](https://github.com/ynotdraw/slab-elements/commit/e5b3ee214e66743dee20d5ff8d08859a60dfedce) Thanks [@ynotdraw](https://github.com/ynotdraw)! - Combobox takes `multiple`. Each selected Option is shown before the input as a tag, a button that removes it, and choosing an Option toggles it and leaves the listbox open. Backspace in an empty input removes the last tag, and Left at the start of the input moves to the tags. `values` reads and sets every selected value, in the order they were chosen, and each is submitted as its own entry, as a `<select multiple>` submits them. Style the tags with `::part(tag)` and `::part(tags)`, and name their buttons with `removeLabel`.

- [#9](https://github.com/ynotdraw/slab-elements/pull/9) [`7c4e2c7`](https://github.com/ynotdraw/slab-elements/commit/7c4e2c7cda4f59a319b9c33da8c4a4e6108c9de3) Thanks [@ynotdraw](https://github.com/ynotdraw)! - Adds Toggle Group, `slab-toggle-group`, and its `slab-toggle-group-button`: a row of toggle buttons that Tab reaches once and the arrow keys move between. One button is pressed at a time, or several with `multiple`. Set `pressed` on a button that starts out pressed; the group handles `aria-pressed`. `value` and `values` read and set which are pressed.

## 0.1.1

### Patch Changes

- [#5](https://github.com/ynotdraw/slab-elements/pull/5) [`719cb17`](https://github.com/ynotdraw/slab-elements/commit/719cb17f9bf632f110f0626852d5d16388e7a7ac) Thanks [@ynotdraw](https://github.com/ynotdraw)! - The package now includes its custom elements manifest. Tools that read `"customElements"` from `package.json`, such as IDE plugins, Storybook and linters, can find every component's attributes, properties, events, slots, CSS parts and custom properties. It's at `slab-elements/custom-elements.json`.

## 0.1.0

### Minor Changes

- [`0a09ca2`](https://github.com/ynotdraw/slab-elements/commit/0a09ca2dce01690e083cbc41a1b00b82458c06d3) Thanks [@ynotdraw](https://github.com/ynotdraw)! - The first release: 32 headless Web Components, each built on a native element, with keyboard and focus handling, ARIA, form participation and events, and no visual styles. Style them with `::part()` and `:state()`, or subclass them and set `styles`. See [slab-elements.dev](https://slab-elements.dev) to get started.
