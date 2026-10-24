---
title: Date Range Field
group: Form
element: '<input type=date>'
tags: [slab-date-range-field]
summary: 'A start and an end date, each on the native date input, linked so the end is never before the start.'
example: |
  <slab-styled-date-range-field label="Pour window" start-label="Earliest" end-label="Latest" min="2026-10-12" start-value="2026-10-16" end-value="2026-10-20" required>
    <span slot="description">The crew needs at least one dry day in the window.</span>
  </slab-styled-date-range-field>
usage: |
  <slab-date-range-field label="Stay" name="stay" start-label="Check-in" end-label="Check-out" required></slab-date-range-field>
---

Each input's bound is the other's value, as well as `min` and `max`, so a browser's picker won't offer an end before the start. An end typed before the start isn't changed to fit: it stays, and the field is `rangeUnderflow` and `rangeOverflow`, as a date outside `min` and `max` is on a single input. The form gets two entries under `name`, the start and then the end, even when one is empty.

The group is named by `label`, and each input by it and then its own label, "Start" and "End" unless you set `start-label` and `end-label`, so a screenreader reads "Stay Check-in". Lay the inputs out with `::part(fields)`. For a calendar instead of the browser's picker, [Calendar](../calendar/) with `range` picks the same thing, as "yyyy-mm-dd/yyyy-mm-dd".

## Keyboard

| Key            | What it does                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Tab, Shift+Tab | Moves from the start to the end, and out of the field. Firefox stops at each part of a date first. |
| Enter          | Submits the form.                                                                                  |
| Anything else  | What it does on a native date input, where the browser edits the date.                             |
