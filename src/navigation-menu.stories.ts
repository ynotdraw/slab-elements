import './navigation-menu.js';
import './navigation-menu.item.js';
import { html } from 'lit';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Navigation Menu',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/navigation-menu.js';
          import 'slab-elements/navigation-menu.item.js';
        </script>

        ${story()}`,
  ],
  parameters: {
    actions: {
      handles: ['toggle slab-navigation-menu-item'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    label: 'Main',
    'slot="default"': '',
    version: '',
  },
  argTypes: {
    label: {
      table: {
        type: { summary: 'string', detail: '// Names the navigation.' },
      },
      type: { name: 'string', required: true },
    },
    'slot="default"': {
      control: false,
      table: {
        type: {
          summary: 'Element',
          detail:
            '// Links and Navigation Menu Items, each in an `<li>` of its own. Each Item is a button that shows and hides links of its own.',
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
    return html`<slab-navigation-menu label=${arguments_.label}>
      <a href="#" aria-current="page">Home</a>

      <slab-navigation-menu-item label="Services">
        <a href="#">Pouring</a>
        <a href="#">Finishing</a>
        <a href="#">Repair</a>
      </slab-navigation-menu-item>

      <slab-navigation-menu-item label="Company">
        <a href="#">About</a>
        <a href="#">Careers</a>
      </slab-navigation-menu-item>

      <a href="#">Contact</a>
    </slab-navigation-menu>`;
  },
};

export default meta;

export const NavigationMenu: StoryObj = {};
