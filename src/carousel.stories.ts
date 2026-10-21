import './carousel.js';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Carousel',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/carousel.js';
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
    autoplay: false,
    index: 0,
    interval: 5000,
    loop: false,
    version: '',
  },
  argTypes: {
    label: {
      table: {
        type: { summary: 'string', detail: '// Names the carousel.' },
      },
      type: { name: 'string', required: true },
    },
    'slot="default"': {
      control: false,
      table: {
        type: { summary: 'Element', detail: '// The slides' },
      },
      type: { name: 'function', required: true },
    },
    'addEventListener(event, handler)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "change", handler: (event: Event) => void): void\n\n// When the user moves to another slide, or rotation does.',
        },
      },
    },
    autoplay: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            "// Moves to the next slide every `interval` milliseconds until it's stopped.",
        },
      },
    },
    index: {
      control: { type: 'number', min: 0 },
      table: {
        defaultValue: { summary: '0' },
        type: { summary: 'number', detail: "// The current slide's, from 0." },
      },
    },
    interval: {
      control: { type: 'number', min: 0 },
      table: {
        defaultValue: { summary: '5000' },
        type: {
          summary: 'number',
          detail:
            '// How long each slide shows for when `autoplay` is set, in milliseconds.',
        },
      },
    },
    loop: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail: '// Previous and Next wrap from one end to the other.',
        },
      },
    },
    markerLabel: {
      control: false,
      table: {
        defaultValue: { summary: '(index) => `Slide ${index + 1}`' },
        type: {
          summary: '(index: number) => string',
          detail:
            "// Names each slide's marker, which has no text, from the slide's index.",
        },
      },
    },
    'next-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// The next button\'s text and so its accessible name. "Next slide" when unset.',
        },
      },
    },
    'previous-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// The previous button\'s text and so its accessible name. "Previous slide" when unset.',
        },
      },
    },
    slideLabel: {
      control: false,
      table: {
        defaultValue: {
          summary: '(index, total) => `${index + 1} of ${total}`',
        },
        type: {
          summary: '(index: number, total: number) => string',
          detail:
            '// Names each slide without a name of its own, from its index and how many slides there are.',
        },
      },
    },
    'start-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// The rotation button\'s text while rotation is stopped. "Start slide rotation" when unset.',
        },
      },
    },
    'stop-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// The rotation button\'s text while the slides rotate. "Stop slide rotation" when unset.',
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
    return html`<slab-carousel
      index=${arguments_.index}
      interval=${arguments_.interval}
      label=${arguments_.label}
      next-label=${ifDefined(arguments_['next-label'])}
      previous-label=${ifDefined(arguments_['previous-label'])}
      start-label=${ifDefined(arguments_['start-label'])}
      stop-label=${ifDefined(arguments_['stop-label'])}
      ?autoplay=${arguments_.autoplay}
      ?loop=${arguments_.loop}
    >
      <div>One</div>
      <div>Two</div>
      <div>Three</div>
    </slab-carousel>`;
  },
};

export default meta;

export const Carousel: StoryObj = {};
