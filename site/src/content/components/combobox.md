---
title: Combobox
group: Selection
element: '<input role=combobox>'
tags: [slab-combobox]
summary: 'A text input that filters a list of Options as you type, to pick one or, with `multiple`, several as removable tags.'
example: |
  <div class="stack">
    <slab-styled-combobox label="Supplier" placeholder="Start typing a name">
      <slab-styled-option value="alder">Alder Ready-Mix</slab-styled-option>
      <slab-styled-option value="basalt">Basalt Concrete Co.</slab-styled-option>
      <slab-styled-option value="cascade">Cascade Aggregates</slab-styled-option>
      <slab-styled-option value="delta">Delta Batch Plant</slab-styled-option>
      <slab-styled-option value="eagle" disabled>Eagle Rock Materials</slab-styled-option>
    </slab-styled-combobox>
    <slab-styled-combobox label="Crews" placeholder="Add a crew" multiple>
      <slab-styled-option value="north" selected>North Yard</slab-styled-option>
      <slab-styled-option value="south">South Yard</slab-styled-option>
      <slab-styled-option value="finishers" selected>Finishers</slab-styled-option>
      <slab-styled-option value="pump">Pump Truck</slab-styled-option>
      <slab-styled-option value="night">Night Pour</slab-styled-option>
    </slab-styled-combobox>
  </div>
usage: |
  <slab-combobox label="Language" name="language">
    <slab-option value="en">English</slab-option>
    <slab-option value="es">Spanish</slab-option>
    <slab-option value="fr">French</slab-option>
  </slab-combobox>
---

Its Options, and Option Groups, are the same ones [Listbox](../listbox/) uses.

With `multiple`, each selected Option is shown before the input as a tag, a button that removes it. Choosing an Option toggles it and leaves the listbox open for the next one. `values` lists them in the order they were chosen, and each is submitted as its own entry, the way a `<select multiple>` submits them. `removeLabel` names the tags' buttons, "Remove" and the Option's text by default.

## Keyboard

| Key       | What it does                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------- |
| Up, Down  | Opens the listbox and moves the active Option, stopping at each end and skipping disabled ones. |
| Alt+Down  | Opens the listbox without moving.                                                               |
| Alt+Up    | Closes the listbox.                                                                             |
| Enter     | Selects the active Option and closes the listbox.                                               |
| Escape    | Closes the listbox, and a second Escape clears the input.                                       |
| Home, End | Move the caret, as in any input.                                                                |

With `multiple`, Enter toggles the active Option and leaves the listbox open, and a second Escape clears only what's typed. These are added:

| Key                             | What it does                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| Backspace                       | In an empty input, removes the last tag.                                                        |
| Left                            | At the start of the input, moves to the last tag.                                               |
| Left, Right                     | On a tag, moves to the previous or next one. Right from the last goes back to the input.        |
| Backspace, Delete, Enter, Space | On a tag, removes it and moves to the one that takes its place, or the input when there's none. |
| Escape                          | On a tag, goes back to the input.                                                               |
