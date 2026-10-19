---
title: Calendar
group: Data
element: '<table role=grid>'
tags: [slab-calendar]
summary: "A month of days to pick from, or with `range`, a range of them. It's the grid from the APG's date picker, with all the keyboard support you'd expect."
example: |
  <div class="stack">
    <slab-styled-calendar min="2026-10-12" max="2026-12-18" value="2026-10-16"></slab-styled-calendar>
    <slab-styled-calendar range value="2026-10-19/2026-10-23"></slab-styled-calendar>
  </div>
usage: |
  <slab-calendar value="2026-03-14"></slab-calendar>
---

With `range`, the first day picked starts a range and the second ends it, in either order. Until the second is picked, the days between the first and the one focused or hovered are `::part(preview)`. Then `value` is the range as "yyyy-mm-dd/yyyy-mm-dd", the ISO 8601 form of an interval, and "change" is dispatched. Its days are `::part(selected)`, and its ends `::part(range-start)` and `::part(range-end)`.

## Keyboard

| Key                | What it does                                             |
| ------------------ | -------------------------------------------------------- |
| Left, Right        | Moves a day, into the month before or after at an end.   |
| Up, Down           | Moves a week.                                            |
| Home, End          | Moves to the start or end of the week.                   |
| Page Up, Page Down | Moves back or forward a month. With Shift, a year.       |
| Enter, Space       | Selects the day and dispatches "change".                 |
| Escape             | With `range`, starts over after the first day is picked. |
