---
'slab-elements': major
---

**Breaking:** Dialog, Alert Dialog, Command Palette and Drawer open the way a native `<dialog>` does. The new `showModal()` opens them as a modal. `show()` and setting `open` open them non-modally, so the rest of the page stays usable and Escape only closes them with `closedby`. Dialog, Alert Dialog and Command Palette used to open as a modal from either.

For a modal opened declaratively, as a framework that binds `open` does, add the new `modal` attribute: `<slab-dialog modal open>` opens as `showModal()` does. A native `<dialog>` has no `modal`, so it's Slab's own. Otherwise, call `showModal()` where you called `show()` for a modal.
