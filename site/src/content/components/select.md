---
title: Select
group: Selection
element: '[role=combobox] + [role=listbox]'
tags: [slab-select]
summary: 'A button that opens a list of Options to pick one or more from. It submits just like a `<select>`.'
example: |
  <slab-styled-select label="Finish" placeholder="Pick a finish">
    <slab-styled-option value="broom">Broom</slab-styled-option>
    <slab-styled-option value="trowel">Hard trowel</slab-styled-option>
    <slab-styled-option value="stamped">Stamped</slab-styled-option>
    <slab-styled-option value="aggregate">Exposed aggregate</slab-styled-option>
    <slab-styled-option value="polished" disabled>Polished</slab-styled-option>
  </slab-styled-select>
usage: |
  <slab-select label="Country" name="country" placeholder="Choose one">
    <slab-option value="ca">Canada</slab-option>
    <slab-option value="mx">Mexico</slab-option>
    <slab-option value="us">United States</slab-option>
  </slab-select>
---

Its Options, and Option Groups, are the same ones [Listbox](../listbox/) uses.

## Keyboard

| Key                               | What it does                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| Enter, Space, Up, Down, Home, End | Closed, opens it.                                                                                |
| Alt+Down                          | Closed, opens it without moving the active Option.                                               |
| A character                       | Closed, selects the next Option whose label starts with what's typed, without opening it.        |
| Enter, Space                      | Open, selects the active Option and closes, or toggles it and stays open when `multiple` is set. |
| Tab, Alt+Up                       | Open, selects the active Option and closes. Alt+Up keeps focus where it is.                      |
| Escape                            | Open, closes without selecting.                                                                  |

Once it's open, the rest of the keys are [Listbox](../listbox/)'s.
