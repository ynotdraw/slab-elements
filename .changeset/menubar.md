---
'slab-elements': patch
---

Adds Menubar, `slab-menubar`: a row of Menus, such as File, Edit and View, following the APG menubar pattern. Each Menu's anchor becomes a `[role=menuitem]` in a `[role=menubar]` with a roving `tabindex`, so Tab reaches it once and Left, Right, Home and End move between the anchors. While a Menu is open, Left and Right close it and open the one beside it, and pointing at another anchor does the same. Opening, closing and moving through each Menu's items is Menu's own. Style it through `::part(menubar)`.
