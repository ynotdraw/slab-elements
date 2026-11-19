---
'slab-elements': minor
---

Clicking a form control's outside label now does what it does for a native control, whether it's a `<label for>` that names the control's `id` or a `<label>` around it. Checkbox and Switch toggle, File Drop opens its file picker, and every other control takes focus. Before, Checkbox and Switch were focused without toggling, and Select, Listbox, Radio Group, Checkbox Group and Rating did nothing. A control's accessible name still comes from its own `label` attribute. Nothing else changes for existing code.
