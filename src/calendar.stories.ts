import './calendar.js';
import { html, nothing } from 'lit';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Calendar',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/calendar.js';
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
    'addEventListener(event, handler)': '',
    max: '',
    min: '',
    'next-label': '',
    'previous-label': '',
    range: false,
    value: '2026-10-15',
    'week-start': 0,
    version: '',
  },
  argTypes: {
    'addEventListener(event, handler)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "change", handler: (event: Event) => void): void\n\n// When the user selects a day, or with `range` the last day of a range.',
        },
      },
    },
    max: {
      table: {
        type: {
          summary: 'string',
          detail: '// The latest date that can be selected, as "yyyy-mm-dd".',
        },
      },
    },
    min: {
      table: {
        type: {
          summary: 'string',
          detail: '// The earliest date that can be selected, as "yyyy-mm-dd".',
        },
      },
    },
    'next-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// The next month button\'s text and so its accessible name. "Next month" when unset.',
        },
      },
    },
    'previous-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// The previous month button\'s text and so its accessible name. "Previous month" when unset.',
        },
      },
    },
    range: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail: '// Selects a range of days rather than one.',
        },
      },
    },
    value: {
      table: {
        defaultValue: { summary: '""' },
        type: {
          summary: 'string',
          detail:
            '// The selected date, as "yyyy-mm-dd", or with `range` the selected range, as "yyyy-mm-dd/yyyy-mm-dd". The attribute is the default value. The property is the current one.',
        },
      },
    },
    'week-start': {
      control: { type: 'number', min: 0, max: 6 },
      table: {
        defaultValue: { summary: '0' },
        type: {
          summary: 'number',
          detail:
            '// The day weeks start on, from 0 for Sunday to 6 for Saturday.',
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
  },
  render(arguments_) {
    /* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
    return html`<slab-calendar
      max=${arguments_.max || nothing}
      min=${arguments_.min || nothing}
      next-label=${arguments_['next-label'] || nothing}
      previous-label=${arguments_['previous-label'] || nothing}
      ?range=${arguments_.range}
      value=${arguments_.value || nothing}
      week-start=${arguments_['week-start']}
    ></slab-calendar>`;
  },
};

export default meta;

export const Calendar: StoryObj = {};

export const Range: StoryObj = {
  args: {
    range: true,
    value: '2026-10-12/2026-10-16',
  },
};
