---
title: Popover
group: Overlays
element: '[popover]'
tags: [slab-popover]
summary: 'Content that pops up beside the element that opened it, in the top layer, and gets dismissed the way a native popover does.'
example: |
  <slab-styled-popover>
    <button class="styled-button" slot="anchor" type="button">Who's on site?</button>
    Ana and Chen are setting forms. Ben brings the pump at 6:30.
  </slab-styled-popover>
usage: |
  <slab-popover placement="bottom">
    <button slot="anchor">Details</button>
    Anything that isn't a menu, a tooltip or a dialog.
  </slab-popover>
---

Give it a `label` when it holds something you work in, such as a form or a few controls, rather than a few words about its anchor. It's then a non-modal dialog named by the label, and the anchor tells screenreaders it opens one with `aria-haspopup="dialog"`.

## Keyboard

| Key          | What it does                                                 |
| ------------ | ------------------------------------------------------------ |
| Enter, Space | On the anchor, opens or closes the popover, as a click does. |
| Escape       | Closes the popover and returns focus to the anchor.          |
