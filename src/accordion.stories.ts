import './accordion.js';
import './disclosure.js';
import { html } from 'lit';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Accordion',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/accordion.js';
          import 'slab-elements/disclosure.js';
        </script>

        ${story()}`,
  ],
  parameters: {
    actions: {
      handles: ['toggle'],
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
    exclusive: false,
    version: '',
  },
  argTypes: {
    'slot="default"': {
      control: false,
      table: {
        type: {
          summary: 'Disclosure',
          detail: '// Found by class, so a subclass under any tag name counts.',
        },
      },
    },
    'addEventListener(event, handler)': {
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "toggle", handler: (event: ToggleEvent) => void): void\n\n// Bubbled from each Disclosure.',
        },
      },
      type: { name: 'function' },
    },
    exclusive: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            '// Whether opening a Disclosure closes the others. When more than one is open, the first is kept.',
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
    return html`<slab-accordion ?exclusive=${arguments_.exclusive}>
      <slab-disclosure label="One">One</slab-disclosure>
      <slab-disclosure label="Two">Two</slab-disclosure>
      <slab-disclosure label="Three">Three</slab-disclosure>
    </slab-accordion>`;
  },
};

export default meta;

export const Accordion: StoryObj = {};
