---
title: Date Range Picker
group: Form
element: '<input type=date>'
tags: [slab-date-range-picker]
summary: 'A Date Range Field with a button that opens a range Calendar in a popover, so both days are picked in one calendar that looks the same in every browser.'
example: |
  <slab-styled-date-range-picker label="Pour window" start-label="Earliest" end-label="Latest" min="2026-10-12" start-value="2026-10-16" end-value="2026-10-20">
    <span slot="description">The crew needs at least one dry day in the window.</span>
  </slab-styled-date-range-picker>
usage: |
  <slab-date-range-picker label="Stay" name="stay" start-label="Check-in" end-label="Check-out" required></slab-date-range-picker>
---

It's [Date Range Field](../date-range-field/), so the two inputs, their values, validity and the form all work the same, and the form still gets the start and then the end under `name`. The browser's own pickers are hidden where they can be, and the button after the inputs opens a [Calendar](../calendar/) with `range` in a non-modal dialog named by the label. Firefox keeps its own calendar icon in each input, which can't be hidden.

Opening it focuses the range's first day, or else today, kept between `min` and `max`. The first day picked starts the range and the second ends it, in either order. Picking the second sets both values, dispatches "input" and "change", closes the calendar and puts focus back on the button. A range left half picked is dropped when the calendar closes. `open` reflects whether it's open, and `showPicker()` and `hidePicker()` open and close it. Like a native input's, `showPicker()` only works from a user gesture, such as a click, and throws while it's disabled or read-only. The Calendar's parts are exported with the same names, so style its days with `::part(range-start)`, `::part(range-end)`, `::part(selected)`, `::part(preview)` and the rest.

## Keyboard

| Key                  | What it does                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| Alt+Down             | In either input, opens the calendar.                                                              |
| Enter, Space         | On the button, opens or closes the calendar. On a day, starts the range, or ends it and closes.   |
| Escape               | After the first day, starts the range over. Otherwise closes the calendar and focuses the button. |
| Arrows, Page Up/Down | Moves between days and months, as on Calendar.                                                    |
| Enter (in an input)  | Submits the form.                                                                                 |
