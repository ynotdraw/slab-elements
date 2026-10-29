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
    <slab-styled-menu-item>Export report</slab-styled-menu-item>
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

## Keyboard

| Key                | What it does                                                                  |
| ------------------ | ----------------------------------------------------------------------------- |
| Enter, Space, Down | On the anchor, opens the menu at the first Menu Item.                         |
| Up                 | On the anchor, opens the menu at the last Menu Item.                          |
| Up, Down           | Moves to the previous or next Menu Item, wrapping and skipping disabled ones. |
| Home, End          | Moves to the first or last Menu Item.                                         |
| A character        | Moves to the next Menu Item whose label starts with what's typed.             |
| Enter, Space       | Clicks the active Menu Item and closes the menu.                              |
| Escape             | Closes the menu and returns focus to the anchor.                              |
| Tab                | Closes the menu and moves focus on.                                           |
