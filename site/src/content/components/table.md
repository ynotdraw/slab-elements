---
title: Table
group: Data
element: '[role=table] + rowgroups, rows and cells'
tags:
  [
    slab-table,
    slab-table-head,
    slab-table-body,
    slab-table-foot,
    slab-table-row,
    slab-table-column-header,
    slab-table-cell,
  ]
summary: 'Rows and columns, laid out and announced like a native table, that components can render into. Column headers can be buttons that sort.'
example: |
  <slab-styled-table aria-label="Pours">
    <slab-styled-table-head>
      <slab-styled-table-row>
        <slab-styled-table-column-header sortable sort="ascending">Slab</slab-styled-table-column-header>
        <slab-styled-table-column-header sortable>Yards</slab-styled-table-column-header>
        <slab-styled-table-column-header sortable>Poured</slab-styled-table-column-header>
      </slab-styled-table-row>
    </slab-styled-table-head>
    <slab-styled-table-body>
      <slab-styled-table-row>
        <slab-styled-table-cell row-header>Driveway</slab-styled-table-cell>
        <slab-styled-table-cell>12</slab-styled-table-cell>
        <slab-styled-table-cell>2026-09-14</slab-styled-table-cell>
      </slab-styled-table-row>
      <slab-styled-table-row>
        <slab-styled-table-cell row-header>Garage</slab-styled-table-cell>
        <slab-styled-table-cell>18</slab-styled-table-cell>
        <slab-styled-table-cell>2026-08-30</slab-styled-table-cell>
      </slab-styled-table-row>
      <slab-styled-table-row>
        <slab-styled-table-cell row-header>Patio</slab-styled-table-cell>
        <slab-styled-table-cell>8</slab-styled-table-cell>
        <slab-styled-table-cell>2026-10-02</slab-styled-table-cell>
      </slab-styled-table-row>
    </slab-styled-table-body>
    <slab-styled-table-foot>
      <slab-styled-table-row>
        <slab-styled-table-cell row-header>Total</slab-styled-table-cell>
        <slab-styled-table-cell>38</slab-styled-table-cell>
        <slab-styled-table-cell></slab-styled-table-cell>
      </slab-styled-table-row>
    </slab-styled-table-foot>
  </slab-styled-table>
usage: |
  <h2 id="caption">Pours</h2>

  <slab-table aria-labelledby="caption">
    <slab-table-head>
      <slab-table-row>
        <slab-table-column-header sortable sort="ascending">Slab</slab-table-column-header>
        <slab-table-column-header sortable>Yards</slab-table-column-header>
      </slab-table-row>
    </slab-table-head>
    <slab-table-body>
      <slab-table-row>
        <slab-table-cell row-header>Driveway</slab-table-cell>
        <slab-table-cell>12</slab-table-cell>
      </slab-table-row>
      <slab-table-row>
        <slab-table-cell row-header>Patio</slab-table-cell>
        <slab-table-cell>8</slab-table-cell>
      </slab-table-row>
    </slab-table-body>
  </slab-table>
---

A native `<table>` can only hold its own elements, so a component that renders a row or a cell can't go in one. Table and its parts can. Each is laid out as the element it stands for, `display: table-row` for a Table Row and so on, so columns size to fit their content and line up across the head, body and foot, and each has that element's role. Table Head goes first and Table Foot last, wherever they are in the markup.

Name the Table as you would a native one, with `aria-labelledby` pointing at a heading or caption near it, or with `aria-label`. Give the Cell that says what a row is about, such as a name, `row-header`, and it becomes the row's header, like a `<th scope="row">`, so a screenreader moving down a column reads each Cell with it.

A `sortable` Column Header is a `<button>`. Clicking it sorts its column ascending, or descending when it's already ascending, sets `sort`, and dispatches "sort" from the Column Header. Every other Column Header in its Table goes back to `sort="none"` first, so only one column is sorted, and only it has `aria-sort`. Screenreaders are told how it's sorted, "Sorted by Yards, descending", which you can word with `sortedLabel` or `tableSorted` in `registerStrings()`. Put an arrow in its `sort-indicator` slot, or draw one on `:state(ascending)` and `:state(descending)`.

Sorting the rows is yours, since Table doesn't move them: on "sort", put the Table Body's rows in the order the Column Header's `sort` says, as the example above does, or sort your data and let your framework render it. Set `sort` yourself for a Table that starts out sorted.

It's a table, not a grid. It's read, not moved through with the arrow keys, and only a sortable Column Header's button and what you put in a Cell take focus. Cells can't span columns or rows.

## Keyboard

| Key          | What it does                                                       |
| ------------ | ------------------------------------------------------------------ |
| Tab          | Moves to each sortable Column Header, then to what's in the Cells. |
| Enter, Space | On a sortable Column Header, sorts its column.                     |
