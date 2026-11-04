---
title: Grid List
group: Data
element: '[role=grid] + rows'
tags: [slab-grid-list, slab-grid-list-item]
summary: 'A list of rows that can hold their own buttons, links and checkboxes, moved through with the arrow keys and optionally selected.'
example: |
  <slab-styled-grid-list label="Pour tickets" selection-mode="multiple">
    <slab-styled-grid-list-item label="Driveway" selected>
      <span>Driveway, 12 yards</span>
      <a href="#driveway">Ticket</a>
      <slab-styled-copy-button label="Copy number" value="T-4817"></slab-styled-copy-button>
    </slab-styled-grid-list-item>
    <slab-styled-grid-list-item label="Garage">
      <span>Garage, 18 yards</span>
      <a href="#garage">Ticket</a>
      <slab-styled-copy-button label="Copy number" value="T-4790"></slab-styled-copy-button>
    </slab-styled-grid-list-item>
    <slab-styled-grid-list-item label="Patio">
      <span>Patio, 8 yards</span>
      <a href="#patio">Ticket</a>
      <slab-styled-copy-button label="Copy number" value="T-4822"></slab-styled-copy-button>
    </slab-styled-grid-list-item>
    <slab-styled-grid-list-item disabled label="Walkway">
      <span>Walkway, not poured yet</span>
    </slab-styled-grid-list-item>
  </slab-styled-grid-list>
usage: |
  <slab-grid-list label="Files" selection-mode="multiple">
    <slab-grid-list-item label="plan.pdf">
      plan.pdf
      <button type="button">Share</button>
      <a href="/files/plan.pdf">Download</a>
    </slab-grid-list-item>
    <slab-grid-list-item label="site.jpg">
      site.jpg
      <button type="button">Share</button>
      <a href="/files/site.jpg">Download</a>
    </slab-grid-list-item>
  </slab-grid-list>
---

Use a Grid List where each item in a list has controls of its own, such as a row of files, each with Share and Download. A Listbox's Options can't hold controls, and a plain list of them puts every control in the Tab order. A Grid List is reached by Tab once, and the arrow keys move between rows and between the controls in a row, as in React Aria's GridList and the APG's grid.

Each row takes the controls in it out of the Tab order with `tabindex="-1"`, Slab's own Checkbox and Copy Button included, so Tab leaves the Grid List rather than stopping at each. Give each row a `label` when it holds controls, so a screenreader reads "plan.pdf" rather than "plan.pdf Share Download".

Rows aren't selected unless `selection-mode` is `"single"` or `"multiple"`. Then a click on a row, but not on a control in it, selects it, and Grid List dispatches "change". A design can draw a check box on `:state(selectable)` and fill it on `:state(selected)`, as the styled one does. It's only shown, since the row is what's selected and what a screenreader says is selected.

## Keyboard

| Key          | What it does                                                                               |
| ------------ | ------------------------------------------------------------------------------------------ |
| Tab          | Reaches the row focus was last in, or else the first selected or first row, then leaves.   |
| Down, Up     | Moves to the next or previous row, skipping disabled ones, from a row or a control in one. |
| Home, End    | Moves to the first or last row.                                                            |
| Right, Left  | Moves from a row to each of its controls and back to the row. Swapped right to left.       |
| Escape       | Moves from a control back to its row.                                                      |
| A character  | Moves to the next row whose text starts with what's typed.                                 |
| Enter, Space | Selects the row, or toggles it when `multiple`. Does nothing when `none`.                  |

A control that edits text, such as a text `<input>`, keeps its arrow keys,
Home and End, so Escape is the way back to its row. With `multiple`, Shift
with Up or Down moves and toggles, Shift with Space selects from the last
selected row to the focused one, Control or Command with Shift and Home or
End selects from the focused row to the first or last, and Control or
Command with A selects every row, or none.
