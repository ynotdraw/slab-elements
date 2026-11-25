---
'slab-elements': minor
---

Table rows can be selected. Set `selectable` on a Table for one row at a time, or `multiple` for more than one, and each body row starts with a check box that selects it, named "Select" and its row header's text. With `multiple`, the head row gets a check box that selects every row, or none, and Shift with a click selects a range. Table dispatches "change" when the user changes the selection, and has `selectedRow` and `selectedRows`. Table Row has `selected` and `disabled`, `:state(selected)`, `:state(selectable)` and `:state(disabled)`, and `checkbox` and `selection-cell` parts. Name the check boxes with `select-all-label`, `selection-label` and `selectRowLabel`, or with `tableSelectAll`, `tableSelectRow` and `tableSelection` in `registerStrings()`.
