---
title: Calendar
group: Data
element: '<table role=grid>'
tags: [slab-calendar]
summary: "A month of days to pick from, or with `range`, a range of them. It's the grid from the APG's date picker, with all the keyboard support you'd expect."
example: |
  <div class="stack">
    <slab-styled-calendar min="2026-10-12" max="2026-12-18" value="2026-10-16"></slab-styled-calendar>
    <slab-styled-calendar months="2" range value="2026-10-19/2026-10-23"></slab-styled-calendar>
  </div>
usage: |
  <slab-calendar value="2026-03-14"></slab-calendar>
---

Picking a day tells screenreaders which day is now selected, since a focused day's selection changing isn't read out on its own. Change what they're told with `selectedLabel`, a function of the formatted day.

With `range`, the first day picked starts a range and the second ends it, in either order. Until the second is picked, the days between the first and the one focused or hovered are `::part(preview)`. Then `value` is the range as "yyyy-mm-dd/yyyy-mm-dd", the ISO 8601 form of an interval, and "change" is dispatched. Its days are `::part(selected)`, and its ends `::part(range-start)` and `::part(range-end)`. Screenreaders are told when the first day starts the range, and what the range is once the second ends it. Change what they're told with `rangeStartedLabel` and `rangeSelectedLabel`, functions of the formatted day and range.

## Unavailable dates

To keep days from being picked, such as weekends or ones already booked, set `isDateUnavailable` to a function of a "yyyy-mm-dd" day that returns `true` for each one. It's a property, so it's set from script. Unlike days outside `min` and `max`, an unavailable day can still be focused, so the keys move across it as across any other, but it can't be selected. It's `aria-disabled` and `::part(unavailable)`. With `range`, a range can't span one: once the first day is picked, the days past the nearest unavailable day on either side are `::part(disabled)` until the last is picked. The function is called as the days are drawn, so set a new one when what it returns changes.

```html
<slab-calendar range></slab-calendar>

<script type="module">
  const booked = new Set(['2026-10-21', '2026-10-22']);

  document.querySelector('slab-calendar').isDateUnavailable = (date) => {
    const day = new Date(date).getUTCDay();
    return day === 0 || day === 6 || booked.has(date);
  };
</script>
```

## More than one month

Set `months` to show that many months side by side, from the one the tabbable day is in. Each month has its own grid, named by its own `::part(month-heading)`, and the heading between the buttons names them all, such as "October – November 2026". The keys move from one month to the next as they do in one, and the months shown follow the tabbable day. The previous and next buttons move them a month at a time. Lay the months out with `::part(months)`, which holds a `::part(month)` for each.

```html
<style>
  slab-calendar::part(months) {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
  }
</style>

<slab-calendar months="2" range></slab-calendar>
```

## Keyboard

| Key                | What it does                                             |
| ------------------ | -------------------------------------------------------- |
| Left, Right        | Moves a day, into the month before or after at an end.   |
| Up, Down           | Moves a week.                                            |
| Home, End          | Moves to the start or end of the week.                   |
| Page Up, Page Down | Moves back or forward a month. With Shift, a year.       |
| Enter, Space       | Selects the day and dispatches "change".                 |
| Escape             | With `range`, starts over after the first day is picked. |
