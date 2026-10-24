---
'slab-elements': patch
---

Adds Hover Card, `slab-hover-card`: a preview of what a link leads to, slotted beside its `anchor` in a native `[popover]` in the top layer. It opens when the anchor is hovered or focused by keyboard, after `open-delay` (700ms by default), and closes when the pointer leaves, after `close-delay` (300ms), when focus leaves it, and on Escape. Unlike Tooltip's, its content can hold links and buttons, which follow the anchor in the focus order, so Tab moves into the card. A touch doesn't open it. `placement` picks the side it opens on, and it flips when there's no room. Style it through `::part(card)` and `:state(open)`.
