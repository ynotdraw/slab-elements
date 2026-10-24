---
title: Command Palette
group: Overlays
element: '<dialog> + <input role=combobox>'
tags: [slab-command-palette]
summary: "A modal search for commands: type to filter a list of Options, then Enter runs the best match. It's a Combobox in a Dialog."
example: |
  <button class="styled-button" type="button" data-open="command-palette-example">
    Search commands
  </button>

  <slab-styled-command-palette
    id="command-palette-example"
    label="Commands"
    placeholder="Type a command"
    closedby="any"
    hide-label
  >
    <slab-styled-option value="schedule">Schedule a pour</slab-styled-option>
    <slab-styled-option value="order">Order ready-mix</slab-styled-option>
    <slab-styled-option value="crew">Assign a crew</slab-styled-option>
    <slab-styled-option value="forms">Strip the forms</slab-styled-option>
    <slab-styled-option value="cure" disabled>Log a cure test</slab-styled-option>
    <slab-styled-option value="invoice">Send an invoice</slab-styled-option>
    <span slot="empty">No commands match.</span>
  </slab-styled-command-palette>
usage: |
  <slab-command-palette label="Commands" placeholder="Type a command">
    <slab-option value="new-file">New file</slab-option>
    <slab-option value="open-file">Open file</slab-option>
    <slab-option value="settings">Settings</slab-option>
    <span slot="empty">No results</span>
  </slab-command-palette>
---

It's [Dialog](../dialog/) with a [Combobox](../combobox/)'s input and listbox inside, and its Options are the same ones Combobox uses. Open it by setting `open` or calling `show()`. Choosing an Option closes it with that Option's `value` as `returnValue`, so a "close" handler knows what to run. Escape, or a click outside with `closedby="any"`, closes it with an empty `returnValue`.

```js
const palette = document.querySelector('slab-command-palette');

document.addEventListener('keydown', (event) => {
  if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    palette.show();
  }
});

palette.addEventListener('close', () => {
  if (palette.returnValue) {
    run(palette.returnValue);
  }
});
```

Typing filters the Options by their text. Replace `filter` to match on more, like keywords, or listen for "input" and read `query` to fetch results as the user types. What's slotted into `empty` is shown, and announced, when nothing matches.

## Keyboard

| Key       | What it does                                                                           |
| --------- | -------------------------------------------------------------------------------------- |
| Up, Down  | Move the active Option, stopping at each end and skipping disabled ones.               |
| Enter     | Chooses the active Option and closes the palette. Typing makes the first match active. |
| Escape    | Closes the palette and dispatches "cancel", which can be canceled to keep it open.     |
| Home, End | Move the caret, as in any input.                                                       |
