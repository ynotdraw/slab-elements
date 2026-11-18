---
'slab-elements': minor
---

Every form control now has a read-only `labels`, as native inputs do. It's the `<label>` elements associated with the control, from `ElementInternals.labels`: each `<label for>` that names its `id`, and a `<label>` around it. Nothing changes for existing code.
