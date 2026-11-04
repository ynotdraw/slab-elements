---
title: Menu
group: Navigation
element: '[role=menu] + [popover]'
tags: [slab-menu, slab-menu-item, slab-menu-group]
summary: "A button that opens a list of actions. It's the APG's menu button, keyboard and all."
example: |
  <slab-styled-menu label="Job actions">
    <button class="styled-button" slot="anchor" type="button">Actions</button>

    <slab-styled-menu-item>Schedule a pour</slab-styled-menu-item>
    <slab-styled-menu-item>Duplicate job</slab-styled-menu-item>

    <slab-styled-menu label="Export report">
      <slab-styled-menu-item slot="anchor">Export report</slab-styled-menu-item>
      <slab-styled-menu-item>PDF</slab-styled-menu-item>
      <slab-styled-menu-item>Spreadsheet</slab-styled-menu-item>
    </slab-styled-menu>

    <slab-styled-menu-item disabled>Call the inspector</slab-styled-menu-item>

    <slab-styled-menu-group label="Crew">
      <slab-styled-menu-item type="radio" checked>Day shift</slab-styled-menu-item>
      <slab-styled-menu-item type="radio">Night shift</slab-styled-menu-item>
    </slab-styled-menu-group>
  </slab-styled-menu>
usage: |
  <slab-menu label="File">
    <button slot="anchor">File</button>

    <slab-menu-item>New</slab-menu-item>
    <slab-menu-item>Open…</slab-menu-item>
    <slab-menu-item disabled>Save</slab-menu-item>
  </slab-menu>
---

To do something when a Menu Item is chosen, listen for its "click".

A Menu Item with `type="checkbox"` or `type="radio"` is a `menuitemcheckbox` or `menuitemradio`, and a click checks it before your "click" listener hears it. Put each set of radios in a `slab-menu-group` with a `label`, so they're named together and a click unchecks only the radios in that group.

```html
<slab-menu label="View">
  <button slot="anchor">View</button>

  <slab-menu-item type="checkbox" checked>Show grid</slab-menu-item>

  <slab-menu-group label="Units">
    <slab-menu-item type="radio" checked>Metric</slab-menu-item>
    <slab-menu-item type="radio">Imperial</slab-menu-item>
  </slab-menu-group>
</slab-menu>
```

## Submenus

Put a `slab-menu` inside another, with a `slab-menu-item` in its `anchor` slot, to make a submenu. Its Menu Item is one of its parent's, and opens it beside the parent. Give the submenu a `label`, usually the same as its Menu Item's.

```html
<slab-menu label="File">
  <button slot="anchor">File</button>

  <slab-menu-item>New</slab-menu-item>

  <slab-menu label="Share">
    <slab-menu-item slot="anchor">Share</slab-menu-item>

    <slab-menu-item>Email</slab-menu-item>
    <slab-menu-item>Message</slab-menu-item>
  </slab-menu>
</slab-menu>
```

Resting the pointer on a submenu's Menu Item for a moment opens it, and moving on to another of its parent's Menu Items closes it after the same moment, so the pointer can cut across on its way in. A click on a Menu Item in a submenu closes every Menu it's in.

## Keyboard

| Key                | What it does                                                                  |
| ------------------ | ----------------------------------------------------------------------------- |
| Enter, Space, Down | On the anchor, opens the menu at the first Menu Item.                         |
| Up                 | On the anchor, opens the menu at the last Menu Item.                          |
| Up, Down           | Moves to the previous or next Menu Item, wrapping and skipping disabled ones. |
| Home, End          | Moves to the first or last Menu Item.                                         |
| A character        | Moves to the next Menu Item whose label starts with what's typed.             |
| Enter, Space       | Clicks the active Menu Item and closes the menu, or opens its submenu.        |
| Escape             | Closes the menu and returns focus to the anchor.                              |
| Tab                | Closes the menu and moves focus on.                                           |
| Right              | On a Menu Item with a submenu, opens it at its first Menu Item.               |
| Left               | In a submenu, closes it and returns focus to its Menu Item.                   |
| Escape             | In a submenu, closes only the submenu and returns focus to its Menu Item.     |
