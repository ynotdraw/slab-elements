---
'slab-elements': patch
---

Menu Item has a `type` of `checkbox` or `radio`, which makes it a `menuitemcheckbox` or `menuitemradio` with `aria-checked`, `checked`, and `:state(checked)`. A click checks it before any "click" listener hears it. The new Menu Group, `slab-menu-group`, is a named `[role=group]` for a set of radio Menu Items in a Menu or Context Menu. Its Menu Items are still the Menu's, so the arrow keys and typeahead move through them as through the rest.
