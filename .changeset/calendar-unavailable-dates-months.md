---
'slab-elements': minor
---

Calendar can now mark days as unavailable and show more than one month at a time. Date Picker and Date Range Picker pass both to their Calendar.

- `isDateUnavailable` is a function of a "yyyy-mm-dd" day that returns `true` for a day that can't be picked, such as a weekend or a day that's already booked. An unavailable day can still be focused, so the arrow keys move across it, but it can't be selected. It's `aria-disabled` and `::part(unavailable)`. With `range`, a range can't span an unavailable day. Set a new function when what it returns changes.
- `months` shows that many months side by side. Each has its own grid and `::part(month-heading)`, and the heading between the buttons names them all. The months shown follow the focused day, and the previous and next buttons move them a month at a time.

Calendar's grid is now inside two new parts, `::part(months)` and `::part(month)`, which you can use to lay out several months. Styles that select Calendar's parts work as before.
