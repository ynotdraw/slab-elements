import './pagination.js';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Pagination',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/pagination.js';
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
    total: 10,
    'addEventListener(event, handler)': '',
    page: 1,
    siblings: 1,
    version: '',
  },
  argTypes: {
    total: {
      control: { type: 'number', min: 1 },
      table: {
        type: { summary: 'number', detail: '// How many pages there are.' },
      },
      type: { name: 'number', required: true },
    },
    'addEventListener(event, handler)': {
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "change", handler: (event: Event) => void): void\n\n// When the user changes the page.',
        },
      },
      type: { name: 'function' },
    },
    label: {
      table: {
        type: {
          summary: 'string',
          detail: '// Names the navigation. "Pagination" when unset.',
        },
      },
    },
    'next-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// The next button\'s text and so its accessible name. "Next" when unset.',
        },
      },
    },
    page: {
      control: { type: 'number', min: 1 },
      table: {
        defaultValue: { summary: '1' },
        type: {
          summary: 'number',
          detail: '// The current page, from 1 to `total`.',
        },
      },
    },
    pageLabel: {
      control: false,
      table: {
        defaultValue: { summary: '(page) => `Page ${page}`' },
        type: {
          summary: '(page: number) => string',
          detail:
            "// Names each page's button, which shows only the number, from that number.",
        },
      },
    },
    'previous-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// The previous button\'s text and so its accessible name. "Previous" when unset.',
        },
      },
    },
    siblings: {
      control: { type: 'number', min: 0 },
      table: {
        defaultValue: { summary: '1' },
        type: {
          summary: 'number',
          detail: '// How many pages are shown either side of the current one.',
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
    return html`<slab-pagination
      label=${ifDefined(arguments_.label)}
      next-label=${ifDefined(arguments_['next-label'])}
      page=${arguments_.page}
      previous-label=${ifDefined(arguments_['previous-label'])}
      siblings=${arguments_.siblings}
      total=${arguments_.total}
    ></slab-pagination>`;
  },
};

export default meta;

export const Pagination: StoryObj = {};
