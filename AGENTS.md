# AGENTS.md

Notes for coding agents working on Slab itself. Using Slab in another project
is a different job: read [`skills/slab/SKILL.md`](skills/slab/SKILL.md) for
that.

[CONTRIBUTING.md](CONTRIBUTING.md) is the full set of conventions, with the
reasons behind them. Read it before changing a component. This file is the
short version, plus the things that trip agents up.

## Layout

- `src/<name>.ts` is a component. Its functional CSS is `src/<name>.styles.ts`,
  its tests are `src/<name>.test.<suite>.ts`, and its Storybook stories are
  `src/<name>.stories.ts`. Parts of a component are named after it, like
  `src/tabs.tab.ts`.
- `src/library/` holds shared controllers and helpers.
- `src/styled/` holds the styled subclasses (`slab-styled-*`) that the docs
  site's examples use.
- `src/eslint/` and `src/stylelint/` hold the repository's own lint rules,
  with tests of their own.
- `site/` is the docs site, a separate Astro package. A component's page is
  `site/src/content/components/<name>.md`.
- `skills/slab/` is the agent skill that ships in the package. Most of it is
  generated. See [Generated files](#generated-files).

## API design

- **Match native HTML.** Name events, methods, properties and attributes the
  way the platform does, and behave the way the platform does: `open` with
  `show()`, `showModal()` and `close()`, "toggle" as a `ToggleEvent`, "input"
  and "change" like an `<input>`, `checkValidity()` and `setCustomValidity()`
  from `ElementInternals`. When native and an earlier Slab choice disagree and
  the difference is only preference, go with native.
- Build on the native element the component corresponds to. Use an ARIA role
  only where the platform has no element for the job.
- No visual styles in a component, only CSS it can't work without. Expose a
  `part` for everything a design styles and a `:state()` for everything it
  reacts to.
- Events bubble and are composed, and are a plain `Event` unless the payload
  exists nowhere else. The analyzer finds events by their `dispatchEvent()`
  calls, so redispatch any native event you want documented.
- Use `#private` members, refs instead of `@query`, `#onSomething` handler
  names, and optional types (`label?: string`) instead of `!`.
- Text a component generates, such as an accessible name, gets an attribute
  that overrides it, defaulting to English.
- Use the platform where it's supported and let older browsers do without.
  Don't polyfill.

## Tests

Tests are Playwright, run in Chromium, Firefox and WebKit, and need 100%
coverage.

- Import `test` and `expect` from `./playwright/test.js`, never from
  `@playwright/test`.
- Render markup with the `render` fixture, not Storybook stories:

  ```ts
  test('can be checked', { tag: '@mouse' }, async ({ render, page }) => {
    await render(() => html`<slab-checkbox label="Label"></slab-checkbox>`);
  });
  ```

  The template runs in the browser, so it can't use variables from the test.
  Pass them as `render`'s second argument. See
  [`src/playwright/fixtures/render.ts`](src/playwright/fixtures/render.ts).

- Give each test exactly one tag, matching its file's suite:
  `*.test.keyboard.ts` tests are tagged `@keyboard`, and so on. Don't use
  `describe()` or hooks like `beforeEach()`. Put setup in each test.
- Assert events with `toDispatchEvents()`, accessibility with
  `toBeAccessible()` and an inline `toMatchAriaSnapshot()`, and forms with
  `toHaveFormData()`.
- Tests that depend on today's date must fix the clock. A Calendar day that's
  today gets an extra `today` part, so tests that match `part` exactly call
  `page.clock.setFixedTime()` first.
- In CI a failed test is retried once, and a test that passes only on retry
  still fails "Verify Test Results". Fix the flake. Don't retry it away.

Run one component's tests with:

```sh
pnpm exec playwright test --config ./src/playwright/playwright.config.ts --project functionality src/checkbox
```

Locally that runs Chromium only. Set `PLAYWRIGHT_BROWSER` to `firefox` or
`webkit` for the others. CI runs all three.

## Styled layer

`src/styled/` is held to the same `slab/no-private-selectors` Stylelint rule
as the components, so it only uses selectors a consumer could write: parts,
`:state()`, `::slotted()` and `:host(...)`. No tag selectors, and no
structural pseudo-classes like `:last-child` or `:not()` after a part. When
the styled layer needs to know something a selector can't tell it, add a
`:state()` to the component.

## Generated files

These are generated and committed, and CI fails when they're out of date:

- `custom-elements.json`, from the components' source.
- The JSDoc `@attr`, `@prop`, `@method` and similar tags in each component,
  written back into the source from the manifest. Don't write them by hand.
  Write the comment above the property, or inside the slot or part, instead.
- The docs site's link preview cards in `site/public/og/`, and the text they
  were drawn from in `site/og/cards.json`. A new page, or a change to a page's
  heading, eyebrow or description, needs `pnpm --filter slab-site og`. It
  draws only missing and out-of-date cards, and needs Playwright's Chromium.
  `pnpm lint` fails until it's run.
- `skills/slab/references/*.md` and the component index in
  `skills/slab/SKILL.md`, from the manifest, the JSDoc and the docs site's
  component pages. The rest of `SKILL.md` is written by hand.

`NODE_ENV=production pnpm start` regenerates all but the cards and fails on any
difference, as CI does. To regenerate without building Storybook:

```sh
pnpm exec tsc --noCheck --outDir ./dist
pnpm exec cem analyze --config ./custom-elements.config.js --quiet
pnpm exec tsx ./src/ts-morph/run.ts
pnpm exec tsx ./src/build/skill.ts
```

Run them in that order after changing a component's API or JSDoc, and commit
the result.

## Changesets

Add a changeset (`pnpm changeset`) when consumers would notice the change, and
write it for them: what changed and what they need to do. Follow semver, and
deprecate before removing, as
[CONTRIBUTING.md](CONTRIBUTING.md#deprecating-something) describes.

Don't add one for a fix to something that hasn't been released yet, when its
own changeset is still in `.changeset/`. Don't add one for changes to tests,
tooling, CI or the docs site.

## Pull requests

- One component per pull request.
- Before pushing, run `pnpm typecheck`, `pnpm lint` and the tests for what you
  changed. CI runs Format, Lint, Typecheck, the lint rules' tests, the
  functionality tests in 10 shards, and a coverage check.
- Format only the files you touched.
- After `eslint --fix` sorts class members, check that comments moved with
  their members.

## Dependencies

`pnpm-workspace.yaml` sets `minimumReleaseAge` to a week, so pnpm won't
install a version published more recently than that. Don't lower it or add
exceptions to get around it. Pick an older version, or wait.
