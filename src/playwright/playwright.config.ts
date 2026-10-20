// `playwright.config.ts` instead of simply `config.ts` so it gets picked up by
// Playwright Test For VS Code.

import os from 'node:os';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { viteUrl } from './constants.js';
import { type CoverageReporterOptions } from './coverage-reporter.js';

export default defineConfig({
  fullyParallel: true,
  testDir: path.join(process.cwd(), 'src'),
  outputDir: path.join(process.cwd(), 'dist', 'playwright'),
  projects: [
    {
      name: 'lint rules',

      testMatch: [
        'src/eslint/rules/*.test.ts',
        'src/stylelint/rules/*.test.ts',
      ],
    },
    ...['webkit', 'firefox', 'chromium']
      .filter((browser) => {
        if (process.env.CI) {
          return true;
        }

        // For testing a specific browser locally.
        if (process.env.PLAYWRIGHT_BROWSER) {
          return process.env.PLAYWRIGHT_BROWSER === browser;
        }

        return browser === 'chromium';
      })
      .map((browser) => {
        return {
          name: 'functionality',
          // "accessibility" tests really aren't functionality tests in the same way that
          // other functionality tests are. Labeling them as such is somewhat of a misnomer.
          //
          // But, if we were to put accessibility tests into their own project, CI would get
          // a lot more complicated because we'd have two more jobs. And we'd have to merge
          // coverage reports from disparate jobs.
          testMatch: ['src/*.test.*.ts', 'src/library/*.test.ts'],

          use:
            browser === 'webkit'
              ? {
                  ...devices['Desktop Safari'],
                }
              : browser === 'firefox'
                ? {
                    ...devices['Desktop Firefox'],
                  }
                : {
                    ...devices['Desktop Chromium'],
                    // - https://playwright.dev/docs/browsers#chromium-new-headless-mode
                    // - https://developer.chrome.com/blog/chrome-headless-shell
                    channel: 'chromium',
                  },
        };
      }),
  ],
  reporter: [
    // - 'list' for terminals.
    // - 'blob' for `pnpm exec playwright merge-reports`.
    ['list'],
    [
      'blob',
      {
        outputDir: path.join(
          process.cwd(),
          'dist',
          'playwright',
          'test-report',
        ),
      },
    ],
    [
      './coverage-reporter.ts',
      {
        // What ships, plus the library behind it. Stylesheets hold no logic,
        // and the elements under `src/playwright` exist to be driven by a
        // test rather than to be tested.
        include: [
          'src/*.ts',
          'src/library/*.ts',
          '!src/*.styles.ts',
          '!src/*.stories.ts',
          '!src/playwright/**',
        ],

        outputDir: 'coverage-report',

        // - 'text-summary' and 'text` for terminals.
        // - 'html' for the browser.
        // - 'lcov' for editor extensions and tooling generally.
        // - 'json' for `merge-coverage-reports/run.ts`.
        reporters: [
          ['text-summary'],
          ['text'],
          ['html'],
          ['lcov'],
          ['json', { file: 'coverage.json' }],
        ],

        thresholds: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      } satisfies CoverageReporterOptions,
    ],
  ],
  // Recording a trace for every test slows the suite by about a fifth, and in
  // CI nearly every trace is thrown away. So CI retries a failed test once with
  // a trace instead. `failOnFlakyTests` keeps a test that only passes on retry
  // from passing the run.
  failOnFlakyTests: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    testIdAttribute: 'data-test',
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_NO_WEBSERVER
    ? undefined
    : [
        // Playwright runs this from the directory holding this config. pnpm
        // treats a script run from a subdirectory as a recursive workspace
        // command and won't find it, so point it at the repository root.
        {
          name: 'Vite',
          command: 'pnpm test:development:playwright:vite',
          cwd: path.join(import.meta.dirname, '..', '..'),
          reuseExistingServer: true,
          url: viteUrl,
        },
      ],
  workers: process.env.CI ? os.cpus().length : os.cpus().length / 2,
});
