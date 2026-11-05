---
'slab-elements': patch
---

The protected hooks that Slab's own subclasses override, such as Dialog's `renderContent()` and Date Field's `renderControl()`, are left out of the published types and `custom-elements.json`. They were never documented and aren't public API, so they can change without a major version. Subclass an element to set `styles`, as the docs show.
