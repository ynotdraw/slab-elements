---
'slab-elements': patch
---

Combobox, Select, Menu, Context Menu, Tooltip, Hover Card, Date Picker and Date Range Picker dispatch "beforetoggle" before they open or close, as Popover does. Cancelling it while one is opening keeps it closed, and `open` stays `false`.
