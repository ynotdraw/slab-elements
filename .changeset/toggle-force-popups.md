---
'slab-elements': minor
---

Menu, Context Menu, Select, Combobox, Tooltip and Hover Card have a `toggle(force?)` method, as Popover and Navigation Menu Item do. Like a native popover's `togglePopover()`, it opens the component when it's closed and closes it when it's open, `true` only opens it and `false` only closes it, and it returns whether the component is open afterward. It returns `false` when the component stays closed, such as while it's disabled or when a "beforetoggle" listener cancels opening. Context Menu opens below whatever in its target has focus, and `toggle(true)` leaves an open one where it is.
