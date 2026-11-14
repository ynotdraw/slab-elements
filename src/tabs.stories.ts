import './tabs.js';
import './tabs.panel.js';
import './tabs.tab.js';
import { html } from 'lit';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Tabs',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/tabs.js';
          import 'slab-elements/tabs.panel.js';
          import 'slab-elements/tabs.tab.js';
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
    'slot="tab"': '',
    'addEventListener(event, handler)': '',
    manual: false,
    orientation: 'horizontal',
    version: '',
  },
  argTypes: {
    label: {
      table: {
        type: { summary: 'string' },
      },
      type: { name: 'string', required: true },
    },
    'slot="default"': {
      control: false,
      table: {
        type: {
          summary: 'Panel',
          detail: '// Found by class, so a subclass under any tag name counts.',
        },
      },
    },
    'slot="tab"': {
      control: false,
      table: {
        type: {
          summary: 'Tab',
          detail:
            '// Found by class, so a subclass under any tag name counts. A Tab puts itself in this slot.',
        },
      },
    },
    'addEventListener(event, handler)': {
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "change", handler: (event: Event) => void): void\n\n// When the user selects a Tab.',
        },
      },
      type: { name: 'function' },
    },
    manual: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            '// Space and Enter select the focused Tab rather than focus itself, for Panels that are slow to show.',
        },
      },
    },
    orientation: {
      control: { type: 'radio' },
      options: ['horizontal', 'vertical'],
      table: {
        defaultValue: { summary: '"horizontal"' },
        type: {
          summary: '"horizontal" | "vertical"',
          detail:
            '// Which arrow keys move between Tabs. Where they sit is up to your styles.',
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
    return html`<slab-tabs
      label=${arguments_.label}
      orientation=${arguments_.orientation}
      ?manual=${arguments_.manual}
    >
      <slab-tabs-tab panel="one">One</slab-tabs-tab>
      <slab-tabs-tab panel="two">Two</slab-tabs-tab>
      <slab-tabs-tab panel="three">Three</slab-tabs-tab>

      <slab-tabs-panel name="one">One</slab-tabs-panel>
      <slab-tabs-panel name="two">Two</slab-tabs-panel>
      <slab-tabs-panel name="three">Three</slab-tabs-panel>
    </slab-tabs>`;
  },
};

export default meta;

export const Tabs: StoryObj = {};
