import './breadcrumb.js';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Breadcrumb',
  decorators: [
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/breadcrumb.js';
        </script>

        ${story()}`,
  ],
  parameters: {
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    'slot="default"': '',
    version: '',
  },
  argTypes: {
    'slot="default"': {
      control: false,
      table: {
        type: {
          summary: 'Element',
          detail:
            '// The links, from the first page to the current one. The last gets `aria-current="page"`.',
        },
      },
      type: { name: 'function', required: true },
    },
    label: {
      table: {
        type: {
          summary: 'string',
          detail: '// Names the navigation. "Breadcrumb" when unset.',
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
    return html`<slab-breadcrumb label=${ifDefined(arguments_.label)}>
      <a href="#">One</a>
      <a href="#">Two</a>
      <a href="#">Three</a>
    </slab-breadcrumb>`;
  },
};

export default meta;

export const Breadcrumb: StoryObj = {};
