---
title: Steps
group: Navigation
element: '<ol> + aria-current="step"'
tags: [slab-steps, slab-steps-step]
summary: 'Where the user is in a task of several steps, such as a checkout or a setup wizard, as a numbered list. Steps can be buttons that go back.'
example: |
  <slab-styled-steps label="Pour" step="3">
    <slab-styled-steps-step>
      Survey
      <span slot="description">Lot staked</span>
    </slab-styled-steps-step>
    <slab-styled-steps-step>
      Forms
      <span slot="description">Rebar tied</span>
    </slab-styled-steps-step>
    <slab-styled-steps-step>
      Pour
      <span slot="description">Truck at 7am</span>
    </slab-styled-steps-step>
    <slab-styled-steps-step>
      Cure
      <span slot="description">Seven days</span>
    </slab-styled-steps-step>
  </slab-styled-steps>
usage: |
  <slab-steps label="Checkout" step="2" navigable>
    <slab-steps-step>Cart</slab-steps-step>
    <slab-steps-step>Shipping</slab-steps-step>
    <slab-steps-step disabled>Payment</slab-steps-step>
  </slab-steps>
---

Steps shows where the user is, not each step's content. Show the content for `step` yourself, and move along with `next()` and `previous()` from your own buttons, which don't dispatch "change". Setting `step` past the last Step makes every one complete, for when the task is done.

With `navigable`, each Step is a `<button>`, and clicking one sets `step` and dispatches "change". Set `disabled` on the Steps the user can't go to yet, such as those after the current one in a form that has to be filled in order. Without `navigable`, nothing in it is interactive.

The current Step has `aria-current="step"`, and each complete one has `complete-label` ("Completed" unless you set it) after its label, hidden visually, so screenreaders can tell it from an upcoming one. The number is hidden from them, since they read the list's own. A design's checkmark or color goes on `:state(complete)`, `:state(current)` and `:state(upcoming)`.

## Keyboard

| Key          | What it does                                                                      |
| ------------ | --------------------------------------------------------------------------------- |
| Tab          | In a `navigable` Steps, moves through the Steps' buttons, skipping disabled ones. |
| Enter, Space | On a Step's button, goes to that Step.                                            |
