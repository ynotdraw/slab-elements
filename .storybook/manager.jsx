import { addons, types, useStorybookApi } from 'storybook/manager-api';
import { create } from 'storybook/theming/create';
import { html } from 'lit';
import { STORY_RENDERED } from 'storybook/internal/core-events';
import { IconButton } from 'storybook/internal/components';
import { GithubIcon } from '@storybook/icons';
import logo from './assets/logo.svg';
import React from 'react';

addons.register('github', () => {
  addons.add('github/toolextra', {
    type: types.TOOLEXTRA,
    title: 'GitHub',
    render() {
      const { getCurrentStoryData } = useStorybookApi();

      if (!getCurrentStoryData()) {
        return null;
      }

      const { importPath, title } = getCurrentStoryData();

      return (
        <IconButton>
          <a
            aria-label={`${title}'s source code`}
            href={`https://github.com/ynotdraw/slab-elements/blob/main/${importPath
              .replace(/^\.\//, '') // Remove the leading `./`
              .replace('.stories', '')}`}
          >
            <GithubIcon style={{ color: 'white' }} />
          </a>
        </IconButton>
      );
    },
  });
});

addons.register('title', (api) => {
  api?.on(STORY_RENDERED, () => {
    const storyData = api.getCurrentStoryData();

    // "Switch" → "Switch ⋅ Slab".
    document.title =
      storyData && storyData.title ? `${storyData.title} ⋅ Slab` : 'Slab';
  });
});

addons.setConfig({
  // We've found that people trigger shortcuts accidentally more than not.
  enableShortcuts: false,
  theme: create({
    base: 'dark',
    // The reversed mark — the sidebar chrome is dark.
    brandImage: logo,
    brandTitle: 'Slab',
    fontCode: 'monospace',
  }),
  toolbar: {
    fullscreen: {
      hidden: true, // Just clutter. Rarely used.
    },
  },
});
