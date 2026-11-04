import './table.js';
import './table.body.js';
import './table.cell.js';
import './table.column-header.js';
import './table.foot.js';
import './table.head.js';
import './table.row.js';
import { html } from 'lit';
import { withActions } from '@storybook/addon-actions/decorator';
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
      handles: ['sort'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    'slot="default"': '',
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
  render() {
    return html`<slab-table aria-label="Pours">
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
