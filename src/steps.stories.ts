import './steps.js';
import './steps.step.js';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Steps',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/steps.js';
          import 'slab-elements/steps.step.js';
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
    label: 'Checkout',
    'slot="default"': '',
    'addEventListener(event, handler)': '',
    navigable: false,
    'next()': '',
    'previous()': '',
    step: 2,
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
          summary: 'Step',
          detail: '// The Steps, in order, each in an `<li>` of its own.',
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
            '(event: "change", handler: (event: Event) => void): void\n\n// When the user clicks a Step in a `navigable` Steps.',
        },
      },
      type: { name: 'function' },
    },
    'complete-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// Read by screenreaders after each complete Step\'s label. "Completed" when unset.',
        },
      },
    },
    navigable: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail: '// Makes each Step a button that goes to it.',
        },
      },
    },
    'next()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail:
            '() => void\n\n// Goes to the next Step, or past the last one, where every Step is complete.',
        },
      },
    },
    'previous()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '() => void\n\n// Goes to the previous Step.',
        },
      },
    },
    step: {
      control: { type: 'number', min: 1 },
      table: {
        defaultValue: { summary: '1' },
        type: {
          summary: 'number',
          detail:
            '// The current Step, from 1. The Steps before it are complete.',
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
    return html`<slab-steps
      complete-label=${ifDefined(arguments_['complete-label'])}
      label=${arguments_.label}
      step=${arguments_.step}
      ?navigable=${arguments_.navigable}
    >
      <slab-steps-step>Cart</slab-steps-step>
      <slab-steps-step>
        Shipping
        <span slot="description">Where it's going</span>
      </slab-steps-step>
      <slab-steps-step>Payment</slab-steps-step>
      <slab-steps-step>Review</slab-steps-step>
    </slab-steps>`;
  },
};

export default meta;

export const Steps: StoryObj = {};
