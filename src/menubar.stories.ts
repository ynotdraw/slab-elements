import './menu.js';
import './menu.item.js';
import './menubar.js';
import { html } from 'lit';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Menubar',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/menu.js';
          import 'slab-elements/menu.item.js';
          import 'slab-elements/menubar.js';
        </script>

        ${story()}`,
  ],
  parameters: {
    actions: {
      handles: ['click slab-menu-item'],
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
    version: '',
  },
  argTypes: {
    label: {
      table: {
        type: { summary: 'string', detail: '// Names the menubar.' },
      },
      type: { name: 'string', required: true },
    },
    'slot="default"': {
      control: false,
      table: {
        type: {
          summary: 'Menu',
          detail:
            "// Found by class, so a subclass under any tag name counts. Each Menu's anchor is a menu item of the menubar.",
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
  render(arguments_) {
    return html`<slab-menubar label=${arguments_.label}>
      <slab-menu label="File">
        <button slot="anchor">File</button>

        <slab-menu-item>New</slab-menu-item>
        <slab-menu-item>Open…</slab-menu-item>
        <slab-menu-item disabled>Save</slab-menu-item>
      </slab-menu>

      <slab-menu label="Edit">
        <button slot="anchor">Edit</button>

        <slab-menu-item>Undo</slab-menu-item>
        <slab-menu-item>Redo</slab-menu-item>
      </slab-menu>

      <slab-menu label="View">
        <button slot="anchor">View</button>

        <slab-menu-item>Zoom in</slab-menu-item>
        <slab-menu-item>Zoom out</slab-menu-item>
      </slab-menu>
    </slab-menubar>`;
  },
};

export default meta;

export const Menubar: StoryObj = {};
