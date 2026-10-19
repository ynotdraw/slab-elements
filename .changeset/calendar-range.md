---
'slab-elements': patch
---

Adds `range` to Calendar, `slab-calendar`, to select a range of days rather than one. The first day picked starts the range and the second ends it, in either order, and "change" is dispatched once both are. `value` is then the range as "yyyy-mm-dd/yyyy-mm-dd", the ISO 8601 form of an interval. While the range is being picked, the days from the first to the one focused or hovered are `::part(preview)`, and Escape starts over. The range's days are `::part(selected)` and its ends `::part(range-start)` and `::part(range-end)`, and the grid is `aria-multiselectable`.
