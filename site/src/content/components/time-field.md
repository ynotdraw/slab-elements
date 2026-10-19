---
title: Time Field
group: Form
element: '<input type=time>'
tags: [slab-time-field]
summary: 'A time field built on the native time input. The browser shows a 12- or 24-hour clock for the locale.'
example: |
  <slab-styled-time-field label="Pour time" min="06:00" max="14:00" step="900" value="07:30">
    <span slot="description">Trucks leave the plant on the quarter hour.</span>
  </slab-styled-time-field>
usage: |
  <slab-time-field label="Start time" name="start" min="09:00" max="17:00" required></slab-time-field>
---
