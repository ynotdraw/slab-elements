---
title: Alert Dialog
group: Overlays
element: '<dialog role=alertdialog> (modal)'
tags: [slab-alert-dialog]
summary: "A modal dialog that asks before something can't be undone. Focus starts on Cancel, and a click outside doesn't close it."
example: |
  <button class="styled-button styled-button--danger" type="button" data-open="alert-dialog-example">
    Cancel the pour
  </button>

  <slab-styled-alert-dialog
    id="alert-dialog-example"
    label="Cancel Friday's pour?"
    description="The ready-mix order for Lot 14 is released, and the crew is told to stand down. The plant charges a restocking fee after noon Thursday."
    cancel-label="Keep it"
  >
    <form method="dialog">
      <button class="styled-button styled-button--danger" value="cancel-pour">Cancel pour</button>
    </form>
  </slab-styled-alert-dialog>
usage: |
  <slab-alert-dialog
    label="Delete this file?"
    description="It can't be recovered."
  >
    <form method="dialog">
      <button value="delete">Delete</button>
    </form>
  </slab-alert-dialog>
---

It's [Dialog](../dialog/) for a question that needs an answer, such as
confirming a delete. Screenreaders announce it as an alert dialog and read its
description along with its label as it opens.

Its Cancel button is built in, and focus starts there, so Enter pressed out of
habit doesn't do the thing it's asking about. Put the action that does it in the
default slot, usually a `<form method="dialog">` button: when it closes,
`returnValue` is that button's `value`, or empty when it was canceled. Slot an
`[autofocus]` element in instead when the dialog asks for something typed.

A click outside doesn't close it, so `closedby="any"` is treated as
"closerequest".

## Keyboard

| Key            | What it does                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Tab, Shift+Tab | Moves focus between Cancel and the dialog's other controls. The rest of the page is inert.                |
| Escape         | Closes the dialog, as Cancel does, unless `closedby` is "none". "cancel" can be canceled to keep it open. |
| Enter, Space   | On Cancel, closes the dialog with an empty `returnValue`.                                                 |
