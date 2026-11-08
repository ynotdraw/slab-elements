---
'slab-elements': minor
---

The framework types now type each element's events. In React 19 and Svelte, a handler such as `oncopy-error` or `onchange` gets the event, typed as the element dispatches it, with the element as its `currentTarget`, and Vue checks `@copy-error` the same way. `slab-elements/jsx.js` adds `SlabElementEvents`, every tag's events, and `SlabEventHandler`, for any other framework.
