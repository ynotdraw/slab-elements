---
title: Search Field
group: Form
element: '<input type=search>'
tags: [slab-search-field]
summary: 'A search input with a button that clears it, and Escape that does the same.'
example: |
  <search>
    <slab-styled-search-field label="Search the site log" placeholder="Pour, cure, strip…">
      <span slot="description">Press Escape to clear it.</span>
    </slab-styled-search-field>
  </search>
usage: |
  <search>
    <slab-search-field label="Search" name="q"></slab-search-field>
  </search>
---

The input is a native search input, so screenreaders read it as a search box and phones show a search key. The clear button shows only while there's something to clear and the field can be changed. It's left out of the tab order, since Escape clears the input too, and clearing it puts focus back in the input and dispatches `input` and `change` the way typing does. The browser's own clear button, which Chrome and Safari draw and Firefox doesn't, is hidden so there's one that works the same everywhere.

Escape clears in every browser, not only in those that do it natively. When the field is already empty, Escape is left alone, so a dialog or popover around it still closes. Wrap the field, or the form it's in, in a `<search>` element to make a search landmark. Set `clear-label` to rename the button, or register `searchFieldClear` for another language.

## Keyboard

| Key           | What it does                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Escape        | Clears the input. When it's already empty, does nothing, so it reaches what's around the field. |
| Enter         | Submits the form.                                                                               |
| Anything else | What it does on a native search input.                                                          |
