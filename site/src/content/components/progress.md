---
title: Progress
group: Data
element: '<progress>'
tags: [slab-progress]
summary: "How far along a task is, or just that it's happening when you don't know yet. That's your spinner, too."
example: |
  <div class="stack">
    <slab-styled-progress label="Curing" max="100" value="43"></slab-styled-progress>
    <slab-styled-progress label="Waiting for the site sensor"></slab-styled-progress>
  </div>
usage: |
  <slab-progress label="Uploading" max="100" value="40"></slab-progress>
---

Screenreaders read how far along it is as a percentage. To say it another way, set `formatValue` to a function of `value`, such as `` (value) => `${value} of 10 files` ``, and they'll read what it returns instead. It isn't called while the progress bar is indeterminate.
