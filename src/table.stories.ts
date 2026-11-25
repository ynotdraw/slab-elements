import './table.js';
import './table.body.js';
import './table.cell.js';
import './table.column-header.js';
import './table.foot.js';
import './table.head.js';
import './table.row.js';
import { html, nothing } from 'lit';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Table',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/table.js';
          import 'slab-elements/table.body.js';
          import 'slab-elements/table.cell.js';
          import 'slab-elements/table.column-header.js';
          import 'slab-elements/table.foot.js';
          import 'slab-elements/table.head.js';
          import 'slab-elements/table.row.js';
        </script>

        ${story()}`,
  ],
  parameters: {
    actions: {
      handles: ['change', 'sort'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    'slot="default"': '',
    'addEventListener(event, handler)': '',
    multiple: false,
    'select-all-label': '',
    selectable: false,
    'selection-label': '',
    version: '',
  },
  argTypes: {
    'slot="default"': {
      control: false,
      table: {
        type: {
          summary: 'TableBody | TableFoot | TableHead',
          detail: '// The Table Head, Body and Foot.',
        },
      },
      type: { name: 'function', required: true },
    },
    'addEventListener(event, handler)': {
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "change", handler: (event: Event) => void): void\n\n// When the user checks or unchecks a row\'s check box, or the head row\'s.',
        },
      },
      type: { name: 'function' },
    },
    multiple: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            "// Whether more than one row can be selected, with a check box in the head row that selects every row. Rows are selectable when it's set, without `selectable`.",
        },
      },
    },
    'select-all-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// Names the head row\'s check box when `multiple`. "Select all" in English when unset.',
        },
      },
    },
    selectable: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            '// Whether a row can be selected, with a check box at its start.',
        },
      },
    },
    'selection-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// Names the column of check boxes when the Table is `selectable` but not `multiple`. "Selection" in English when unset.',
        },
      },
    },
    version: {
      control: false,
      table: {
        defaultValue: {
          summary: import.meta.env.VITE_SLAB_VERSION,
        },
        type: { summary: 'string', detail: '// For debugging' },
      },
    },
  },
  render(arguments_) {
    /* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
    return html`<slab-table
      aria-label="Pours"
      ?multiple=${arguments_.multiple}
      select-all-label=${arguments_['select-all-label'] || nothing}
      ?selectable=${arguments_.selectable}
      selection-label=${arguments_['selection-label'] || nothing}
    >
      <slab-table-head>
        <slab-table-row>
          <slab-table-column-header sortable sort="ascending">
            Slab
          </slab-table-column-header>
          <slab-table-column-header sortable>Yards</slab-table-column-header>
          <slab-table-column-header>Mix</slab-table-column-header>
        </slab-table-row>
      </slab-table-head>
      <slab-table-body>
        <slab-table-row>
          <slab-table-cell row-header>Driveway</slab-table-cell>
          <slab-table-cell>12</slab-table-cell>
          <slab-table-cell>4,000 psi</slab-table-cell>
        </slab-table-row>
        <slab-table-row>
          <slab-table-cell row-header>Patio</slab-table-cell>
          <slab-table-cell>8</slab-table-cell>
          <slab-table-cell>3,000 psi</slab-table-cell>
        </slab-table-row>
      </slab-table-body>
      <slab-table-foot>
        <slab-table-row>
          <slab-table-cell row-header>Total</slab-table-cell>
          <slab-table-cell>20</slab-table-cell>
          <slab-table-cell></slab-table-cell>
        </slab-table-row>
      </slab-table-foot>
    </slab-table>`;
  },
};

export default meta;

export const Table: StoryObj = {};
