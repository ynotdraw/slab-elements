// The "_" prefix hides it from Annotations pane in Playwright's UI. It showing
// up in a report is just a distraction.
export const v8CoverageAnnotationType = '_v8-coverage';

// Overridable so parallel checkouts, such as worktrees, can each test against
// their own server. With `reuseExistingServer`, two checkouts on the same
// port test against whichever started first.
export const vitePort = Number(process.env.SLAB_VITE_PORT ?? 6009);

export const viteUrl = `http://localhost:${vitePort}/src/playwright/index.html`;
