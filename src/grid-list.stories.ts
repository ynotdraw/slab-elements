import './grid-list.js';
import './grid-list.item.js';
import { html } from 'lit';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Grid List',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/grid-list.js';
          import 'slab-elements/grid-list.item.js';
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
    label: 'Label',
    'slot="default"': '',
    'addEventListener(event, handler)': '',
    multiple: false,
    selectable: false,
    version: '',
  },
  argTypes: {
    label: {
      table: {
        type: { summary: 'string', detail: '// Names the grid list.' },
      },
      type: { name: 'string', required: true },
    },
    'slot="default"': {
      control: false,
      table: {
        type: {
          summary: 'GridListItem',
          detail:
            '// Found by class, so a subclass under any tag name counts. Put controls such as buttons and links in each.',
        },
      },
      type: { name: 'function', required: true },
    },
    'addEventListener(event, handler)': {
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "change", handler: (event: Event) => void): void\n\n// When the user selects a row.',
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
            "// Whether more than one row can be selected. Rows are selectable when it's set, without `selectable`.",
        },
      },
    },
    selectable: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail: '// Whether a row can be selected.',
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
    return html`<slab-grid-list
      label=${arguments_.label}
      ?multiple=${arguments_.multiple}
      ?selectable=${arguments_.selectable}
    >
      <slab-grid-list-item label="plan.pdf">
        plan.pdf
        <button type="button">Share</button>
        <a href="#plan">Download</a>
      </slab-grid-list-item>
      <slab-grid-list-item label="site.jpg">
        site.jpg
        <button type="button">Share</button>
        <a href="#site">Download</a>
      </slab-grid-list-item>
      <slab-grid-list-item disabled label="notes.txt"
        >notes.txt</slab-grid-list-item
      >
    </slab-grid-list>`;
  },
};

export default meta;

export const GridList: StoryObj = {};
