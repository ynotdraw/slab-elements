# slab-elements

## 0.1.1

### Patch Changes

- [#5](https://github.com/ynotdraw/slab-elements/pull/5) [`719cb17`](https://github.com/ynotdraw/slab-elements/commit/719cb17f9bf632f110f0626852d5d16388e7a7ac) Thanks [@ynotdraw](https://github.com/ynotdraw)! - The package now includes its custom elements manifest. Tools that read `"customElements"` from `package.json`, such as IDE plugins, Storybook and linters, can find every component's attributes, properties, events, slots, CSS parts and custom properties. It's at `slab-elements/custom-elements.json`.

## 0.1.0

### Minor Changes

- [`0a09ca2`](https://github.com/ynotdraw/slab-elements/commit/0a09ca2dce01690e083cbc41a1b00b82458c06d3) Thanks [@ynotdraw](https://github.com/ynotdraw)! - The first release: 32 headless Web Components, each built on a native element, with keyboard and focus handling, ARIA, form participation and events, and no visual styles. Style them with `::part()` and `:state()`, or subclass them and set `styles`. See [slab-elements.dev](https://slab-elements.dev) to get started.
