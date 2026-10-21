import { promises as fs } from 'node:fs';
import { test } from '@playwright/test';
import { type TemplateResult } from 'lit';
import serialize from 'serialize-javascript';
import customElements from '../../../custom-elements.json' with { type: 'json' };
import { v8CoverageAnnotationType, viteUrl } from './../constants.js';

type Context<Type> = Type extends void ? void : Type;

type Render = <Type = void>(
  template: (context: Type) => TemplateResult | Promise<TemplateResult>,
  context?: Context<Type>,
) => Promise<void>;

/**
 * Renders a template, without Storybook:
 *
 * 1. Navigates to a blank page served by Vite.
 * 2. Renders your template onto the page.
 * 3. Waits for any custom elements in the template to be added to the registry.
 * 4. Waits for each custom element's `updateComplete`.
 *
 * Be mindful of Playwright's architecture when using this fixture:
 *
 * Playwright executes tests in Node.js. But the template you pass to this
 * fixture, and any variables or functions referenced therein, will be
 * evaluated in the browser.
 *
 * So you'll get an error, for example, if you reference in your template a
 * variable defined above your `render()` call. The variable may appear to be in
 * scope. But it won't be, and TypeScript won't any know better.
 *
 * This is what the `context` parameter is for. Whatever you pass in as context,
 * be it a primitive or function or date, will get serialized, sent to the browser,
 * and made available to your template when it's rendered. Though you should rarely
 * need `context`. `toDispatchEvents()` is probably what you want instead.
 */
export default test.extend<{
  render: Render;
}>({
  async render({ page }, use, testInfo) {
    await use(async function render<Type = void>(
      template: (context: Type) => TemplateResult | Promise<TemplateResult>,
      context?: Context<Type>,
    ): Promise<void> {
      return test.step('render()', async () => {
        let pageError: Error | undefined;

        page.on('pageerror', (error: Error) => {
          pageError = error;
        });

        await page.route('favicon.ico', (route) => {
          // Stop the browser from attempting to fetch a favicon so a 404 doesn't show up
          // in the console.
          route.abort();
        });

        await page.goto(viteUrl);

        // Now we leave Node.js Land and enter Browser Land:
        //
        // 1. Serialize both the template and its context so they make it across the wire,
        //    and can be evaluated in the browser.
        //
        // 2. Evaluate and call the template function with its context.
        //
        // 3. Call Lit's `render()`, passing in the result of the evaluation and call.
        await page.evaluate(
          async ({ context, template }) => {
            // Errors are also collected here, in the page, rather than only
            // through "pageerror". A component that throws from a promise,
            // as `assertSlot()` does once its host has updated, leaves an
            // unhandled rejection, and "pageerror" can hear of one late, after
            // this fixture has returned. That's been seen in Firefox in CI,
            // where a test expecting the throw passed or failed by timing.
            // The page's own "unhandledrejection" event fires in a task of
            // its own soon after, which the last step below waits for.
            const errors: string[] = [];

            Object.assign(window, { slabRenderErrors: errors });

            window.addEventListener('error', (event) => {
              errors.push(event.message);
            });

            window.addEventListener('unhandledrejection', (event) => {
              errors.push(
                event.reason instanceof Error
                  ? event.reason.message
                  : 'Unhandled promise rejection',
              );
            });

            const { render } = await import('lit');

            render(
              // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-call
              await new Function(
                'context',

                // `html` is always referenced in templates, and `styleMap` sometimes is. So both
                // need to be brought into scope.
                //
                // It's unlikely, but possible, that tests will use other Lit directives. If they
                // do, those directives will also need to be brought into scope. When doing so,
                // don't forget to update the import map in `playwright.html`.
                //
                // This approach simplifies tests. But you can imagine how it may not be suitable
                // for a larger repository with more variation between tests, or in this repository
                // if it sees more variation.
                //
                // An alternative approach would be to only evaluate the template and let tests
                // bring themselves whatever they need into scope:
                //
                //   test('button', async ({ render }) => {
                //     await render(async () => {
                //       const { html } = await import('lit');
                //
                //       return html`<slab-button label="Label"></slab-button>`;
                //     });
                //    })
                `
                  return (async () => {
                    const { html } = await import('lit');
                    const { styleMap } = await import('lit/directives/style-map.js');

                    return (${template})(eval('(' + context + ')'));
                  })();
                `,
              )(context),
              document.body,
            );
          },
          {
            context: serialize(context),
            template: serialize(template),
          },
        );

        const componentTags = await page.evaluate(() => {
          const tags: string[] = [];
          const elements = document.body.querySelectorAll('*');

          for (const element of elements) {
            const isComponent = element.tagName.startsWith('SLAB');
            const isDuplicate = tags.includes(element.tagName.toLowerCase());

            if (isComponent && !isDuplicate) {
              tags.push(element.tagName.toLowerCase());
            }
          }

          return tags;
        });

        for (const tag of componentTags) {
          const isAlreadyDefined = await page.evaluate((tag) => {
            return Boolean(window.customElements.get(tag));
          }, tag);

          // Some components import other components because they depend on them. So a
          // tag may already be registered. If it is, we move on so we don't cause an
          // error when the component is registered again via `addScriptTag()` below.
          if (isAlreadyDefined) {
            continue;
          }

          let scriptPath: string | undefined;

          // Digging through the manifest is only necessary because sub-component names don't
          // map directly to filenames.
          //
          // For example, `slab-button-group-button` maps to `button-group.button.ts`
          // on disk instead of mapping to `button-group-button.ts`.
          //
          // If they were mapped to the latter, we wouldn't have to do any of this.
          for (const module of customElements.modules) {
            const exportedComponent = module.exports.find(({ kind, name }) => {
              return kind === 'custom-element-definition' && name === tag;
            });

            if (exportedComponent) {
              scriptPath = '/' + exportedComponent.declaration.module;
              break;
            }
          }

          if (!scriptPath) {
            throw new Error(
              `"${tag}" wasn't found in \`custom-elements.json\`. Does the component exist? If so, is the manifest up to date? Run \`pnpm start\` to update the manifest.`,
            );
          }

          try {
            await page.addScriptTag({
              url: scriptPath,
              type: 'module',
            });
          } catch {
            if (testInfo.config.webServer?.url) {
              const url = new URL(testInfo.config.webServer.url);

              url.pathname = scriptPath;

              throw new Error(`Failed to load "${url.toString()}".`);
            } else {
              throw new Error(`Failed to load "${scriptPath}".`);
            }
          }
        }

        const errorMessage = await page.evaluate(async () => {
          const elements = document.body.querySelectorAll('*');

          for (const element of elements) {
            if ('updateComplete' in element) {
              await element.updateComplete;
            }
          }

          // A rejection is reported in a task queued after the microtasks
          // that left it unhandled. Waiting out two more tasks gives it room
          // to run first whatever task source a browser queues it on.
          await new Promise((resolve) => setTimeout(resolve));
          await new Promise((resolve) => setTimeout(resolve));

          return (
            window as unknown as { slabRenderErrors: string[] }
          ).slabRenderErrors.at(0);
        });

        if (pageError) {
          throw pageError;
        }

        if (errorMessage !== undefined) {
          throw new Error(errorMessage);
        }
      });
    });
  },

  async page({ page, browser, browserName }, use, testInfo) {
    testInfo.annotations.push({
      type: 'browser',
      description: `${browserName} ${browser.version()}`,
    });

    // As you'd expect, only Chromium supports coverage collection via V8. If, for some
    // reason, we want to collect coverage for other browsers, we can instrument our
    // code using Istanbul. But coverage collection only in Chromium should suffice.
    if (browserName !== 'chromium' || process.env.PLAYWRIGHT_SKIP_COVERAGE) {
      return use(page);
    }

    await page.coverage.startJSCoverage();
    await use(page);

    const v8Coverage = await page.coverage.stopJSCoverage();

    const v8CoveragePath = testInfo.outputPath(
      `${v8CoverageAnnotationType}.json`,
    );

    await fs.writeFile(v8CoveragePath, JSON.stringify({ result: v8Coverage }));

    // An annotation rather than an attachment. The blob reporter copies every
    // attachment into the test report, and each test's coverage is about a
    // megabyte that nothing reads from there.
    testInfo.annotations.push({
      type: v8CoverageAnnotationType,
      description: v8CoveragePath,
    });
  },
});
