import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import './range-slider.js';

const meta: Meta = {
  title: 'Range Slider',
  decorators: [
    withActions,
    (story) =>
      html`<form action="/">
        <script type="ignore">
          import 'slab-elements/range-slider.js';
        </script>

        ${story()}
      </form>`,
  ],
  parameters: {
    actions: {
      handles: ['change', 'input'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    label: 'Label',
    'addEventListener(event, handler)': '',
    'checkValidity()': '',
    disabled: false,
    'end-label': '',
    'end-value': '',
    'hide-label': false,
    max: '',
    min: '',
    name: '',
    'reportValidity()': '',
    'slot="description"': '',
    'start-label': '',
    'start-value': '',
    step: '',
    version: '',
  },
  argTypes: {
    label: {
      table: { type: { summary: 'string' } },
      type: { name: 'string', required: true },
    },
    'addEventListener(event, handler)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "change" | "input", handler: (event: Event) => void): void',
        },
      },
    },
    'checkValidity()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): boolean' } },
    },
    disabled: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    'end-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// Names the end thumb, after `label`. "Maximum" when unset.',
        },
      },
    },
    'end-value': {
      table: {
        type: {
          summary: 'number',
          detail:
            '// The attribute is the default value. The property is the current one, between `start-value` and `max` and on a step. `max` when unset.',
        },
      },
    },
    'hide-label': {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            '// Hides the label visually. It still names the group and the thumbs for screenreaders.',
        },
      },
    },
    max: {
      table: {
        defaultValue: { summary: '100' },
        type: { summary: 'number' },
      },
    },
    min: {
      table: {
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
    name: {
      table: {
        defaultValue: { summary: '""' },
        type: {
          summary: 'string',
          detail:
            '// Submitted twice, with the start value and then the end value.',
        },
      },
    },
    'reportValidity()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): boolean' } },
    },
    'slot="description"': {
      table: { type: { summary: 'Element | string' } },
    },
    'start-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// Names the start thumb, after `label`. "Minimum" when unset.',
        },
      },
    },
    'start-value': {
      table: {
        type: {
          summary: 'number',
          detail:
            '// The attribute is the default value. The property is the current one, between `min` and `end-value` and on a step. `min` when unset.',
        },
      },
    },
    step: {
      table: {
        defaultValue: { summary: '1' },
        type: { summary: 'number' },
      },
    },
    version: {
      control: false,
      table: {
        defaultValue: { summary: import.meta.env.VITE_SLAB_VERSION },
        type: { summary: 'string', detail: '// For debugging' },
      },
    },
  },
  render(arguments_) {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing */
    return html`<slab-range-slider
      label=${arguments_.label || nothing}
      end-label=${arguments_['end-label'] || nothing}
      end-value=${arguments_['end-value'] || nothing}
      max=${arguments_.max || nothing}
      min=${arguments_.min || nothing}
      name=${arguments_.name || nothing}
      start-label=${arguments_['start-label'] || nothing}
      start-value=${arguments_['start-value'] || nothing}
      step=${arguments_.step || nothing}
      ?disabled=${arguments_.disabled}
      ?hide-label=${arguments_['hide-label']}
    >
      ${
        arguments_['slot="description"']
          ? html`<div slot="description">
              ${unsafeHTML(arguments_['slot="description"'])}
            </div>`
          : nothing
      }
    </slab-range-slider>`;
  },
};

export default meta;

export const RangeSlider: StoryObj = {};
