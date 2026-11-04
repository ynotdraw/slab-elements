---
'slab-elements': patch
---

Adds Table, `slab-table`, with `slab-table-head`, `slab-table-body`, `slab-table-foot`, `slab-table-row`, `slab-table-column-header` and `slab-table-cell`: a table that components can render rows and cells into, laid out like a native `<table>` with the same roles. A `sortable` Column Header is a button that sorts its column, sets `aria-sort`, dispatches "sort" and tells screenreaders how the column is sorted. Change what they're told with `tableSorted` in `registerStrings()`.
