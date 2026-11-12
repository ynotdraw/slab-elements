---
'slab-elements': major
---

**Breaking:** Dialog, Alert Dialog, Command Palette and Drawer open modally or not, as a native `<dialog>` does. `show()` now opens them non-modally, so the rest of the page stays usable, and the new `showModal()` opens them as a modal. Setting `open` still opens Dialog, Alert Dialog and Command Palette as a modal, and Drawer non-modally, so call `showModal()` where you called `show()` for a modal.
