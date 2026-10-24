import './feed.js';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Feed',
  decorators: [
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/feed.js';
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
    busy: false,
    label: 'Job log',
    'slot="default"': '',
    total: undefined,
    version: '',
  },
  argTypes: {
    busy: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            "// Articles are being added or removed. A screenreader waits until it's unset.",
        },
      },
    },
    label: {
      table: {
        type: { summary: 'string', detail: '// Names the feed.' },
      },
      type: { name: 'string', required: true },
    },
    'slot="default"': {
      control: false,
      table: {
        type: {
          summary: 'Element',
          detail:
            '// The articles. Each is put in the tab sequence, given its place in the feed, and named by its first heading.',
        },
      },
      type: { name: 'function', required: true },
    },
    total: {
      control: 'number',
      table: {
        type: {
          summary: 'number',
          detail:
            "// How many articles there are in all, including those not added yet, or -1 when that's unknown. The number added when unset.",
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
    return html`<slab-feed
      label=${arguments_.label}
      total=${ifDefined(arguments_.total)}
      ?busy=${arguments_.busy}
    >
      <article>
        <h2>Forms set</h2>
        <p>Braced by 6 a.m. <a href="#">See the photos</a></p>
      </article>

      <article>
        <h2>Pour finished</h2>
        <p>38 cubic yards placed. <a href="#">See the ticket</a></p>
      </article>

      <article>
        <h2>Curing</h2>
        <p>Kept wet for seven days. <a href="#">See the schedule</a></p>
      </article>
    </slab-feed>`;
  },
};

export default meta;

export const Feed: StoryObj = {};
