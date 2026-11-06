---
'slab-elements': patch
---

Dialog, Drawer, Alert Dialog and Command Palette have `requestClose(returnValue)`, as a native `<dialog>` does. It dispatches a cancelable "cancel" and closes only when that isn't canceled.
