---
title: Context Menu
group: Navigation
element: '[role=menu] + [popover]'
tags: [slab-context-menu, slab-menu-item]
summary: "Menu's Menu Items, opened where the user right-clicks or long-presses, or from the keyboard, in place of the browser's own menu."
example: |
  <slab-styled-context-menu label="Pour actions">
    <div slot="target" tabindex="0">Right-click or long-press the pour</div>

    <slab-styled-menu-item>Schedule a pour</slab-styled-menu-item>
    <slab-styled-menu-item>Duplicate job</slab-styled-menu-item>
    <slab-styled-menu-item>Export report</slab-styled-menu-item>
    <slab-styled-menu-item disabled>Call the inspector</slab-styled-menu-item>
  </slab-styled-context-menu>
usage: |
  <slab-context-menu label="File">
    <div slot="target" tabindex="0">Right-click me</div>

    <slab-menu-item>Rename</slab-menu-item>
    <slab-menu-item>Duplicate</slab-menu-item>
    <slab-menu-item disabled>Delete</slab-menu-item>
  </slab-context-menu>
---

To do something when a Menu Item is chosen, listen for its "click". Make the target focusable, or put something focusable in it, so the keyboard can open the menu too. Prevent the default of a "contextmenu" in part of the target to keep the menu from opening there.

On iOS, a long-press on text also starts selecting it. Give the target `user-select: none` if that gets in the way.

## Keyboard

| Key             | What it does                                                                  |
| --------------- | ----------------------------------------------------------------------------- |
| Shift+F10, Menu | In the target, opens the menu below what has focus, at the first Menu Item.   |
| Up, Down        | Moves to the previous or next Menu Item, wrapping and skipping disabled ones. |
| Home, End       | Moves to the first or last Menu Item.                                         |
| A character     | Moves to the next Menu Item whose label starts with what's typed.             |
| Enter, Space    | Clicks the active Menu Item and closes the menu.                              |
| Escape          | Closes the menu and returns focus to where it was.                            |
| Tab             | Closes the menu and moves focus on.                                           |
