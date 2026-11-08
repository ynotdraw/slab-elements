---
'slab-elements': minor
---

Dialog, Drawer, Alert Dialog, Command Palette and Toast dispatch "toggle" when they open and close, as a `ToggleEvent` with `oldState` and `newState` that doesn't bubble, so every element with `open` now does.
