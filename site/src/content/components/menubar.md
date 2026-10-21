---
title: Menubar
group: Navigation
element: '[role=menubar]'
tags: [slab-menubar]
summary: "A row of Menus, such as File, Edit and View, with the arrow keys to move between them. It's the APG's menubar."
example: |
  <slab-styled-menubar label="Job">
    <slab-styled-menu label="Job">
      <button class="styled-menubar-button" slot="anchor" type="button">Job</button>

      <slab-styled-menu-item>New job</slab-styled-menu-item>
      <slab-styled-menu-item>Duplicate job</slab-styled-menu-item>
      <slab-styled-menu-item disabled>Archive job</slab-styled-menu-item>
    </slab-styled-menu>

    <slab-styled-menu label="Pour">
      <button class="styled-menubar-button" slot="anchor" type="button">Pour</button>

      <slab-styled-menu-item>Schedule a pour</slab-styled-menu-item>
      <slab-styled-menu-item>Order a mix</slab-styled-menu-item>
    </slab-styled-menu>

    <slab-styled-menu label="Report">
      <button class="styled-menubar-button" slot="anchor" type="button">Report</button>

      <slab-styled-menu-item>Export report</slab-styled-menu-item>
      <slab-styled-menu-item>Print report</slab-styled-menu-item>
    </slab-styled-menu>
  </slab-styled-menubar>
usage: |
  <slab-menubar label="Editor">
    <slab-menu label="File">
      <button slot="anchor">File</button>

      <slab-menu-item>New</slab-menu-item>
      <slab-menu-item>Open…</slab-menu-item>
    </slab-menu>

    <slab-menu label="Edit">
      <button slot="anchor">Edit</button>

      <slab-menu-item>Undo</slab-menu-item>
      <slab-menu-item>Redo</slab-menu-item>
    </slab-menu>
  </slab-menubar>
---

Each Menu in it is an ordinary [Menu](/components/menu/), with its own `label`, anchor and Menu Items. To do something when a Menu Item is chosen, listen for its "click". Disable a Menu by disabling its anchor.

## Keyboard

| Key                | What it does                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| Left, Right        | On an anchor, moves to the previous or next anchor, wrapping and skipping disabled ones.        |
| Home, End          | On an anchor, moves to the first or last anchor.                                                |
| Enter, Space, Down | On an anchor, opens its Menu at the first Menu Item.                                            |
| Up                 | On an anchor, opens its Menu at the last Menu Item.                                             |
| Left, Right        | In an open Menu, closes it and opens the previous or next Menu, wrapping and skipping disabled. |
| Up, Down           | In an open Menu, moves to the previous or next Menu Item.                                       |
| Escape             | Closes the open Menu and returns focus to its anchor.                                           |
| Tab                | Closes the open Menu and leaves the menubar. Coming back, focus returns to the last anchor.     |
