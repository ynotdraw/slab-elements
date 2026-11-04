import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import './date-range-picker.js';

const meta: Meta = {
  title: 'Date Range Picker',
  decorators: [
    withActions,
    (story) =>
      html`<form action="/">
        <script type="ignore">
          import 'slab-elements/date-range-picker.js';
        </script>

        ${story()}
      </form>`,
  ],
  parameters: {
    actions: {
      handles: ['change', 'input', 'invalid', 'toggle'],
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
    'button-label': '',
    'checkValidity()': '',
    disabled: false,
    'end-label': '',
    'end-value': '',
    'hide-label': false,
    'hidePicker()': '',
    max: '',
    min: '',
    name: '',
    open: false,
    readonly: false,
    'reportValidity()': '',
    required: false,
    'resetValidityFeedback()': '',
    'setCustomValidity(message)': '',
    'setValidity(flags, message)': '',
    'showPicker()': '',
    'slot="description"': '',
    'start-label': '',
    'start-value': '',
    version: '',
    'week-start': 0,
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
            '(event: "change" | "input" | "invalid" | "toggle", handler: (event: Event) => void): void',
        },
      },
    },
    'button-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// The button\'s text and so its accessible name. "Choose dates" in English when unset.',
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
            '// The end input\'s label, read after `label`. "End" when unset.',
        },
      },
    },
    'end-value': {
      table: {
        defaultValue: { summary: '""' },
        type: {
          summary: 'string',
          detail:
            '// "yyyy-mm-dd". The attribute is the default value. The property is the current one.',
        },
      },
    },
    'hide-label': {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            '// Hides the label visually. It still names the group and the inputs for screenreaders.',
        },
      },
    },
    'hidePicker()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: `
(): void

// Closes the calendar.
          `,
        },
      },
    },
    max: {
      table: {
        type: {
          summary: 'string',
          detail: '// The latest date allowed for either, as "yyyy-mm-dd".',
        },
      },
    },
    min: {
      table: {
        type: {
          summary: 'string',
          detail: '// The earliest date allowed for either, as "yyyy-mm-dd".',
        },
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
    open: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            '// Whether the calendar is open. Setting it opens or closes the calendar.',
        },
      },
    },
    readonly: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            '// Unlike `disabled`, a readonly field is still focusable and still submitted.',
        },
      },
    },
    'reportValidity()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): boolean' } },
    },
    required: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean', detail: '// Requires both dates.' },
      },
    },
    'resetValidityFeedback()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: `
(): void

// Clears the validity feedback without changing \`validity\`.
          `,
        },
      },
    },
    'setCustomValidity(message)': {
      control: false,
      table: {
        type: { summary: 'method', detail: '(message: string): void' },
      },
    },
    'setValidity(flags, message)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '(flags?: ValidityStateFlags, message?: string): void',
        },
      },
    },
    'showPicker()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: `
(): void

// Opens the calendar and focuses its tabbable day.
          `,
        },
      },
    },
    'slot="description"': {
      table: { type: { summary: 'Element | string' } },
    },
    'start-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// The start input\'s label, read after `label`. "Start" when unset.',
        },
      },
    },
    'start-value': {
      table: {
        defaultValue: { summary: '""' },
        type: {
          summary: 'string',
          detail:
            '// "yyyy-mm-dd". The attribute is the default value. The property is the current one.',
        },
      },
    },
    version: {
      control: false,
      table: {
        defaultValue: { summary: import.meta.env.VITE_SLAB_VERSION },
        type: { summary: 'string', detail: '// For debugging' },
      },
    },
    'week-start': {
      control: { type: 'number', min: 0, max: 6 },
      table: {
        defaultValue: { summary: '0' },
        type: {
          summary: 'number',
          detail:
            "// The day the calendar's weeks start on, from 0 for Sunday to 6 for Saturday.",
        },
      },
    },
  },
  render(arguments_) {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing */
    return html`<slab-date-range-picker
      button-label=${arguments_['button-label'] || nothing}
      end-label=${arguments_['end-label'] || nothing}
      end-value=${arguments_['end-value'] || nothing}
      label=${arguments_.label || nothing}
      max=${arguments_.max || nothing}
      min=${arguments_.min || nothing}
      name=${arguments_.name || nothing}
      start-label=${arguments_['start-label'] || nothing}
      start-value=${arguments_['start-value'] || nothing}
      week-start=${arguments_['week-start'] || nothing}
      ?disabled=${arguments_.disabled}
      ?hide-label=${arguments_['hide-label']}
      ?open=${arguments_.open}
      ?readonly=${arguments_.readonly}
      ?required=${arguments_.required}
    >
      ${
        arguments_['slot="description"']
          ? html`<div slot="description">
              ${unsafeHTML(arguments_['slot="description"'])}
            </div>`
          : nothing
      }
    </slab-date-range-picker>`;
  },
};

export default meta;

export const DateRangePicker: StoryObj = {};

export const WithError: StoryObj = {
  args: {
    required: true,
  },
};
