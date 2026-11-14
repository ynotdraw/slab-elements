import './tree.js';
import './tree.item.js';
import { html } from 'lit';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Tree',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/tree.js';
          import 'slab-elements/tree.item.js';
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
    version: '',
  },
  argTypes: {
    label: {
      table: {
        type: { summary: 'string', detail: '// Names the tree.' },
      },
      type: { name: 'string', required: true },
    },
    'slot="default"': {
      control: false,
      table: {
        type: {
          summary: 'TreeItem',
          detail:
            '// Found by class, so a subclass under any tag name counts. Nest Tree Items for their children.',
        },
      },
      type: { name: 'function', required: true },
    },
    'addEventListener(event, handler)': {
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "change", handler: (event: Event) => void): void\n\n// When the user selects a Tree Item.',
        },
      },
      type: { name: 'function' },
    },
    multiple: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
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
    return html`<slab-tree
      label=${arguments_.label}
      ?multiple=${arguments_.multiple}
    >
      <slab-tree-item expanded>
        One
        <slab-tree-item>Two</slab-tree-item>
        <slab-tree-item>
          Three
          <slab-tree-item>Four</slab-tree-item>
        </slab-tree-item>
      </slab-tree-item>
      <slab-tree-item>Five</slab-tree-item>
    </slab-tree>`;
  },
};

export default meta;

export const Tree: StoryObj = {};
