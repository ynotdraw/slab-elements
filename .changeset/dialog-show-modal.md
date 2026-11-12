---
'slab-elements': major
---

**Breaking:** Dialog opens modally or not, as a native `<dialog>` does. `show()` now opens it non-modally, so the rest of the page stays usable, and the new `showModal()` opens it as a modal. Setting `open` still opens it as a modal, so call `showModal()` where you called `show()` for one. Alert Dialog and Command Palette stay modal, and Drawer non-modal, whichever method opens them.
