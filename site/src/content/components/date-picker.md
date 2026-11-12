---
title: Date Picker
group: Form
element: '<input type=date>'
tags: [slab-date-picker]
summary: 'A Date Field with a button that opens a Calendar in a popover, so the picker is the same in every browser and yours to style.'
example: |
  <slab-styled-date-picker label="Pour date" min="2026-10-12" value="2026-10-16">
    <span slot="description">The plant needs two days' notice.</span>
  </slab-styled-date-picker>
usage: |
  <slab-date-picker label="Start date" name="start" min="2026-01-01" required></slab-date-picker>
---

It's [Date Field](../date-field/), so the input, the value, validity and the form all work the same. The browser's own picker is hidden where it can be, and the button beside the input opens a [Calendar](../calendar/) in a non-modal dialog named by the label. Firefox keeps its own calendar icon in the input, which can't be hidden.

Opening it focuses the selected day, or else today, kept between `min` and `max`. Picking a day sets the value, dispatches "input" and "change", closes the calendar and puts focus back on the button. `open` reflects whether it's open, and `showPicker()` and `hidePicker()` open and close it. Like a native input's, `showPicker()` only works from a user gesture, such as a click, and throws while it's disabled or read-only. The Calendar's parts are exported with the same names, so style its days with `::part(day)`, `::part(selected)` and the rest. `step` isn't passed to the Calendar, so a day it offers can still be a `stepMismatch`.

## Keyboard

| Key                  | What it does                                                                |
| -------------------- | --------------------------------------------------------------------------- |
| Alt+Down             | In the input, opens the calendar.                                           |
| Enter, Space         | On the button, opens or closes the calendar. On a day, picks it and closes. |
| Escape               | Closes the calendar without picking, and focuses the button.                |
| Arrows, Page Up/Down | Moves between days and months, as on Calendar.                              |
| Enter (in the input) | Submits the form.                                                           |
