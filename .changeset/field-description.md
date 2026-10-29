---
'slab-elements': patch
---

Field now describes its control by what's slotted into `description`, through the control's `aria-describedby`, after any IDs it already has, and sets the control's `aria-invalid` while `error` is set. Before, a screenreader read neither the hint nor the error, nor that the control was invalid.
