import './menu.js';
import './menu.item.js';
import { html } from 'lit';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Menu',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/menu.js';
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
    'slot="anchor"': '',
    open: false,
    placement: 'bottom',
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
    'slot="anchor"': {
      control: false,
      table: {
        type: {
          summary: 'Element',
          detail:
            '// What opens the menu, usually a `<button>`, or a Menu Item for a submenu.',
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
    placement: {
      control: { type: 'radio' },
      options: ['bottom', 'left', 'right', 'top'],
      table: {
        defaultValue: { summary: '"bottom"' },
        type: {
          summary: '"bottom" | "left" | "right" | "top"',
          detail:
            "// The side of its anchor it opens on, when there's room. It flips when there isn't. A submenu ignores it and opens beside its Menu Item.",
        },
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
        type: { summary: 'method', detail: '(): void' },
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
    return html`<slab-menu
      label=${arguments_.label}
      placement=${arguments_.placement}
      ?open=${arguments_.open}
    >
      <button slot="anchor">Anchor</button>

      <slab-menu-item>One</slab-menu-item>
      <slab-menu-item>Two</slab-menu-item>
      <slab-menu-item>Three</slab-menu-item>
    </slab-menu>`;
  },
};

export default meta;

export const Menu: StoryObj = {};

export const Submenu: StoryObj = {
  render(arguments_) {
    return html`<slab-menu
      label=${arguments_.label}
      placement=${arguments_.placement}
      ?open=${arguments_.open}
    >
      <button slot="anchor">Anchor</button>

      <slab-menu-item>One</slab-menu-item>

      <slab-menu label="Two">
        <slab-menu-item slot="anchor">Two</slab-menu-item>

        <slab-menu-item>Two A</slab-menu-item>
        <slab-menu-item>Two B</slab-menu-item>
      </slab-menu>

      <slab-menu-item>Three</slab-menu-item>
    </slab-menu>`;
  },
};
