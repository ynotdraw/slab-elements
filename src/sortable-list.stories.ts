import './sortable-list.js';
import './sortable-list.item.js';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Sortable List',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/sortable-list.js';
          import 'slab-elements/sortable-list.item.js';
        </script>

        ${story()}`,
  ],
  parameters: {
    actions: {
      handles: ['change'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    label: 'Pour order',
    'slot="default"': '',
    'addEventListener(event, handler)': '',
    version: '',
  },
  argTypes: {
    label: {
      table: {
        type: { summary: 'string', detail: '// Names the list.' },
      },
      type: { name: 'string', required: true },
    },
    'slot="default"': {
      control: false,
      table: {
        type: {
          summary: 'SortableListItem',
          detail: '// The items, in order.',
        },
      },
      type: { name: 'function', required: true },
    },
    'addEventListener(event, handler)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "change", handler: (event: Event) => void): void\n\n// When the user drops an item somewhere new.',
        },
      },
      type: { name: 'function' },
    },
    'instructions-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// Describes each handle to screenreaders. "Press Space to pick it up…" when unset.',
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
    return html`<slab-sortable-list
      instructions-label=${ifDefined(arguments_['instructions-label'])}
      label=${arguments_.label}
    >
      <slab-sortable-list-item label="Footings">
        <span slot="handle">⠿</span>
        Footings
      </slab-sortable-list-item>
      <slab-sortable-list-item label="Walls">
        <span slot="handle">⠿</span>
        Walls
      </slab-sortable-list-item>
      <slab-sortable-list-item label="Slab">
        <span slot="handle">⠿</span>
        Slab
      </slab-sortable-list-item>
    </slab-sortable-list>`;
  },
};

export default meta;

export const SortableList: StoryObj = {};
