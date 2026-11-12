---
title: Dialog
group: Overlays
element: '<dialog>'
tags: [slab-dialog]
summary: 'A dialog built on the native `<dialog>`, modal or not. A modal one keeps focus inside, closes on Escape, and makes the rest of the page inert — the platform does the heavy lifting.'
example: |
  <button class="styled-button styled-button--danger" type="button" data-show-modal="dialog-example">
    Strip forms
  </button>

  <slab-styled-dialog id="dialog-example" label="Strip the forms?" closedby="any">
    <p>
      It's day 2 of 7. Concrete reaches about 70% of its strength in a week,
      and stripping the forms now can crack the edges.
    </p>

    <form class="actions" method="dialog">
      <button class="styled-button" value="cancel">Wait</button>
      <button class="styled-button styled-button--danger" value="strip">Strip anyway</button>
    </form>
  </slab-styled-dialog>
usage: |
  <slab-dialog label="Delete this file?">
    <p>It can't be recovered.</p>

    <form method="dialog">
      <button value="cancel">Cancel</button>
      <button value="delete">Delete</button>
    </form>
  </slab-dialog>
---

Open it with `showModal()`. When it closes, `returnValue` tells you which
button did it — same as a `<dialog>`.

## Modal or not

Calling `showModal()` opens it as a modal. Calling `show()`, or setting `open`,
opens it non-modally, the way they open a `<dialog>`: there's no backdrop,
focus can leave it, and the rest of the page stays usable while it's open.

```js
const dialog = document.querySelector('slab-dialog');

dialog.showModal(); // The rest of the page goes inert.
dialog.show(); // The rest of the page stays usable.
```

A `<dialog>` can't be opened as a modal without script, so Slab adds `modal`.
With it, setting `open` opens it as `showModal()` does, which is what a
framework that binds `open` needs. `show()` and `showModal()` still open it as
they say.

```html
<slab-dialog label="Delete this file?" modal open>…</slab-dialog>
```

As with a `<dialog>`, Escape only closes a non-modal one with `closedby`. Set
`closedby="closerequest"` for Escape, or `closedby="any"` for a click outside
it too. Style one or the other with `::part(dialog):modal` and
`::part(dialog):not(:modal)`.

## Keyboard

| Key            | What it does                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| Tab, Shift+Tab | Moves focus between the dialog's controls. When it's modal, the rest of the page is inert.                          |
| Escape         | Closes the dialog and dispatches "cancel", which can be canceled to keep it open. A non-modal one needs `closedby`. |
