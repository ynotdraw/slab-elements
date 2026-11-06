---
'slab-elements': patch
---

Every element's `version` property and attribute are marked internal, so they're out of the published types, `custom-elements.json` and the framework types. They're still there at runtime, for seeing which Slab registered an element, but they aren't public API.
