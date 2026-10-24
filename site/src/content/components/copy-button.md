---
title: Copy Button
group: Form
element: '<button>'
tags: [slab-copy-button]
summary: 'Copy text to the clipboard with a button, and say so once it has.'
example: |
  <div class="stack">
    <pre id="install-command">pnpm add slab-elements</pre>
    <slab-styled-copy-button label="Copy" from="install-command"></slab-styled-copy-button>
  </div>
usage: |
  <div>
    <code id="api-key">sk-live-8f2c</code>
    <slab-copy-button label="Copy key" from="api-key"></slab-copy-button>
  </div>
---

Use `value` for text that isn't on the page, and `from` for text that is, such as a code block or an input. Either way, it's read when the button is pressed. The clipboard is only there in a page served over HTTPS or from localhost, so a copy elsewhere fails, and says so, rather than doing nothing.

The button's name stays its `label` throughout. "Copied" is announced from a status beside it, so a screenreader user hears it without the button changing under them. Show it to everyone else through `:state(copied)`.

## Keyboard

| Key          | What it does                         |
| ------------ | ------------------------------------ |
| Enter, Space | Copies the text, as on a `<button>`. |
