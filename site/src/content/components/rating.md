---
title: Rating
group: Form
element: '[role=radiogroup] + <input type=radio>s'
tags: [slab-rating]
summary: 'A row of native radios from 1 to `max`, with one label and one value, that previews the value under the pointer.'
example: |
  <slab-styled-rating label="Finish" step="0.5" value="3.5">
    <span slot="description">How smooth the slab came out of the trowel.</span>
  </slab-styled-rating>
usage: |
  <slab-rating label="Rating" name="rating" value="3"></slab-rating>
---

Nothing is drawn, so give each `::part(star)` a look, and `::part(filled)` the look of the value. The radios are named by their numbers and the group by `label`, so a screenreader reads "Rating, 3, radio button, 3 of 5". While the pointer is over a radio, the radios up to it are `filled` instead and the host is `:state(previewing)`, which can tell a preview apart from the value.

To name the radios by what they mean, such as "3 stars", set `formatValue` to a function of each radio's number.

With `step="0.5"`, each star is two radios, named "0.5", "1", "1.5" and so on, and the value can be a half. A star's first radio is also `::part(start)` and its second `::part(end)`, so style each as half of a star, such as by clipping each to its half.

## Keyboard

| Key                   | What it does                                                       |
| --------------------- | ------------------------------------------------------------------ |
| Tab                   | Moves into the rating at the checked radio, or the first, and out. |
| Up, Down, Left, Right | Moves to the previous or next radio and checks it.                 |
| Space                 | Checks the focused radio.                                          |
| Enter                 | Submits the form, as on a native radio.                            |
