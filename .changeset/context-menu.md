---
'slab-elements': patch
---

Adds Context Menu, `slab-context-menu`: Menu's Menu Items in a `[role=menu]` popover that opens over whatever is slotted into `target`, in place of the browser's own menu. It opens at the pointer on a right-click or Control-click, where it was pressed on a long-press with a finger or a pen, and below what has focus on Shift+F10 or the Menu key. It's kept on screen, flipping up or back when there isn't room, and it has Menu's keyboard. Prevent the default of a "contextmenu" in part of the target to keep it from opening there. Style it through its parts and `:state(open)`.
