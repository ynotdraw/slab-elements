import './context-menu.js';
import './menu.item.js';
import { html } from 'lit';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Context Menu',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/context-menu.js';
          import 'slab-elements/menu.item.js';
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
    'slot="target"': '',
    open: false,
    'hide()': '',
    'show()': '',
    version: '',
  },
  argTypes: {
    label: {
      table: {
        type: { summary: 'string', detail: '// Names the menu.' },
      },
      type: { name: 'string', required: true },
    },
    'slot="default"': {
      control: false,
      table: {
        type: {
          summary: 'MenuItem',
          detail:
            '// Found by class, so a subclass under any tag name counts. Listen for "click" on each to act on it.',
        },
      },
      type: { name: 'function', required: true },
    },
    'slot="target"': {
      control: false,
      table: {
        type: {
          summary: 'Element',
          detail:
            '// Where a right-click, a long-press, or Shift+F10 opens the menu.',
        },
      },
      type: { name: 'function', required: true },
    },
    open: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    'hide()': {
      control: false,
      table: {
        type: { summary: 'method', detail: '(): void' },
      },
    },
    'show()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '(position?: { x: number; y: number }): void',
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
    return html`<slab-context-menu
      label=${arguments_.label}
      ?open=${arguments_.open}
    >
      <div
        slot="target"
        style="border: 1px dashed; padding: 3rem; text-align: center;"
        tabindex="0"
      >
        Right-click, long-press, or press Shift+F10
      </div>

      <slab-menu-item>One</slab-menu-item>
      <slab-menu-item>Two</slab-menu-item>
      <slab-menu-item>Three</slab-menu-item>
    </slab-context-menu>`;
  },
};

export default meta;

export const ContextMenu: StoryObj = {};
