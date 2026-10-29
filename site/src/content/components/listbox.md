---
title: Listbox
group: Selection
element: '[role=listbox]'
tags: [slab-listbox, slab-option, slab-option-group]
summary: 'A list of Options to pick one or more from, right on the page instead of in a popup.'
example: |
  <slab-styled-listbox label="Crew" multiple>
    <slab-styled-option value="ana" selected>Ana, finisher</slab-styled-option>
    <slab-styled-option value="ben">Ben, pump operator</slab-styled-option>
    <slab-styled-option value="chen">Chen, form setter</slab-styled-option>
    <slab-styled-option value="dee">Dee, laborer</slab-styled-option>
    <slab-styled-option value="eli" disabled>Eli, on leave</slab-styled-option>
  </slab-styled-listbox>
usage: |
  <slab-listbox label="Size" name="size">
    <slab-option value="s">Small</slab-option>
    <slab-option value="m" selected>Medium</slab-option>
    <slab-option value="l">Large</slab-option>
  </slab-listbox>
---

Option, documented here, is also what [Select](../select/) and
[Combobox](../combobox/) use.

To group Options under a heading, put them in a `slab-option-group` with a `label`. It's a `[role=group]` named by its label, and its Options are still the Listbox's, so the keys and selection work across groups as across the rest. Select and Combobox take Option Groups too, and Combobox hides one while its filter hides every Option in it.

```html
<slab-listbox label="Produce">
  <slab-option-group label="Fruit">
    <slab-option>Apple</slab-option>
    <slab-option>Banana</slab-option>
  </slab-option-group>

  <slab-option-group label="Vegetables">
    <slab-option>Carrot</slab-option>
  </slab-option-group>
</slab-listbox>
```

## Keyboard

| Key          | What it does                                                              |
| ------------ | ------------------------------------------------------------------------- |
| Up, Down     | Moves the active Option, stopping at each end and skipping disabled ones. |
| Home, End    | Moves to the first or last Option.                                        |
| A character  | Moves to the next Option whose label starts with what's typed.            |
| Enter, Space | Selects the active Option, or toggles it when `multiple` is set.          |

With `multiple`, Shift with Up or Down moves and toggles, Shift with Space
selects from the last selected Option to the active one, Control or Command
with Shift and Home or End selects from the active one to the first or last,
and Control or Command with A selects every Option, or none.
