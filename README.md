<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/logos/slab-lockup-paper.svg">
  <img src=".github/logos/slab-lockup-ink.svg" alt="Slab" width="300">
</picture>

Headless Web Components · [slab-elements.dev](https://slab-elements.dev)

[![Build status](https://img.shields.io/github/check-runs/ynotdraw/slab-elements/main)](https://github.com/ynotdraw/slab-elements/actions?query=branch%3Amain)
[![NPM version](https://img.shields.io/npm/v/slab-elements)](https://www.npmjs.com/package/slab-elements)

</div>

Slab ships behavior and nothing about how it looks: keyboard and focus
handling, ARIA, form participation, and events. Every component is built on the
native element it corresponds to, so it inherits that element's semantics
rather than reimplementing them. The design is yours, through `::part()` and
`:state()`.

The [docs](https://slab-elements.dev) have every component, each with a styled
example to copy, and a [guide to getting started](https://slab-elements.dev/get-started/).

## Usage

### 1. Install the dependencies

```bash
pnpm install slab-elements lit
```

### 2. Import your component

```js
import 'slab-elements/checkbox.js';
```

### 3. Render it

```html
<slab-checkbox label="Label"></slab-checkbox>
```

### 4. Style it

Slab brings no stylesheet, so a component has no size and nothing to see until
you give it one. Everything a design needs to reach is a `part` or a custom
state:

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

To go further than that, subclass the component, set `styles`, and register
your subclass under a tag of your own. The component's functional styles
survive yours:

```js
import Checkbox from 'slab-elements/checkbox.js';
import { css } from 'lit';

customElements.define(
  'acme-checkbox',
  class extends Checkbox {
    static styles = css`
      /* ... */
    `;
  },
);
```

## Accessibility

Every change is tested in the latest Chromium, Firefox and WebKit. Axe checks
every component for known violations, ARIA snapshot tests pin down each one's
roles, names and states, and keyboard tests cover what each component does with
the keyboard, including in right-to-left layouts. In October 2026, every component's semantics, keyboard
support and announcements were audited, and everything found was fixed.

What hasn't been done yet is testing by hand with a screen reader, such as
VoiceOver, NVDA, JAWS or TalkBack, or with voice control or switch access.
Automated tools catch only some problems. And since Slab is headless, contrast,
focus rings and target sizes are up to your styles.

If a component doesn't work with your assistive technology, please
[open an issue](https://github.com/ynotdraw/slab-elements/issues/new?template=accessibility.yml)
with what you used and what you heard. Pull requests are welcome too.
[Accessibility](https://slab-elements.dev/accessibility/) on the docs site has
more.

## AI disclosure

Slab is built with AI assistance. Much of the code, tests, and docs were
written with Claude Code, under the maintainer's direction and review. Every
change goes through the same bar: typecheck, lint, and a Playwright suite held
at 100% coverage, with accessibility checked by Axe and ARIA snapshots.

## Credits

Slab began as a fork of [Glide Core](https://github.com/CrowdStrike/glide-core),
a Web Component design system published by CrowdStrike under the Apache License
2.0. See [NOTICE](NOTICE) for the original copyright and license.
