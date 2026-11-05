import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import sortClassMembers from 'eslint-plugin-sort-class-members';
import stylistic from '@stylistic/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import typescript from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';
import { defineConfig, globalIgnores } from 'eslint/config';
import html from '@html-eslint/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
import slab from './dist/eslint/plugin.js';

const compat = new FlatCompat();

export default defineConfig([
  // The site is a package of its own. Its scripts are a handful of lines
  // around Astro's templates, which this config doesn't parse.
  globalIgnores(['dist', 'site']),
  {
    extends: [
      // https://github.com/eslint/eslint/blob/main/packages/js/src/configs/eslint-recommended.js
      eslint.configs.recommended,

      // https://github.com/sindresorhus/eslint-plugin-unicorn/tree/main/rules
      unicorn.configs['flat/all'],

      // https://github.com/bryanrsmith/eslint-plugin-sort-class-members/blob/main/src/index.js
      sortClassMembers.configs['flat/recommended'],

      // https://github.com/import-js/eslint-plugin-import/blob/main/config/recommended.js
      importPlugin.flatConfigs.recommended,

      // https://github.com/43081j/eslint-plugin-lit/blob/master/src/configs/recommended.ts
      compat.extends('plugin:lit/recommended'),

      // https://github.com/open-wc/open-wc/blob/master/packages/eslint-plugin-lit-a11y/lib/index.js
      compat.extends('plugin:lit-a11y/recommended'),

      // https://github.com/typescript-eslint/typescript-eslint/blob/9335077904aaa4a8ddcd3b446b5c28dd4e8079bf/packages/eslint-plugin/src/configs/flat/recommended-type-checked.ts
      typescript.configs.recommendedTypeChecked,

      // https://github.com/typescript-eslint/typescript-eslint/blob/9335077904aaa4a8ddcd3b446b5c28dd4e8079bf/packages/eslint-plugin/src/configs/flat/stylistic-type-checked.ts
      typescript.configs.stylisticTypeChecked,

      // https://github.com/prettier/eslint-config-prettier/blob/main/index.js
      prettier,
    ],
  },
  {
    plugins: {
      '@stylistic': stylistic,
      slab,
      html,
    },
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'slab/consistent-reference-element-declarations': 'error',
      'slab/no-nested-template-literals': 'error',
      'slab/no-redundant-property-attribute': 'error',
      'slab/no-redundant-property-string-type': 'error',
      'slab/public-member-return-type': 'error',
      'slab/public-getter-default-comment': 'error',
      'slab/event-dispatch-from-this': 'error',
      'slab/string-event-name': 'error',
      'slab/slot-type-comment': 'error',
      'slab/public-property-expression-type': 'error',
      'slab/use-default-with-property-decorator': 'error',
      'slab/private-state-decorators': 'error',
      'slab/no-protected-keyword': 'error',
      'slab/comment-maximum-length': 'error',

      // Only a few hand-picked rules because much of what the plugin offers either
      // doesn't apply to us (SEO rules) or is covered by other tools (formatting and
      // accessibility rules). The `sort-attrs` rule would be nice. But it doesn't sort
      // attributes alphabetically like it claims to.
      'html/no-duplicate-attrs': 'error',
      'html/no-duplicate-class': 'error',
      'html/no-duplicate-id': 'error',
      'html/no-obsolete-tags': 'error',
      'html/no-trailing-spaces': 'error',

      // Enabling this rule would force us to `await` any function that returns a
      // promise. One example is a function that itself awaits `updateComplete`. The
      // rule is a bit cumbersome in practice.
      '@typescript-eslint/no-floating-promises': 'off',

      // Most of the methods this rule would cover are bound by Lit.
      '@typescript-eslint/unbound-method': 'off',

      // Non-null assertions are often misused. Linting against them increases the chance
      // that developers use them intentionally and, if we're lucky, that they explain
      // why given they have to disable a lint rule to do so.
      '@typescript-eslint/no-non-null-assertion': 'error',

      '@stylistic/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: 'multiline-block-like',
        },
        {
          blankLine: 'always',
          prev: 'multiline-block-like',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'multiline-const',
        },
        {
          blankLine: 'always',
          prev: 'multiline-const',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'multiline-expression',
        },
        {
          blankLine: 'always',
          prev: 'multiline-expression',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'multiline-let',
        },
        {
          blankLine: 'always',
          prev: 'multiline-let',
          next: '*',
        },
        {
          blankLine: 'never',
          prev: 'case',
          next: 'case',
        },
      ],
      '@stylistic/lines-between-class-members': [
        'error',
        'always',
        { exceptAfterSingleLine: false },
      ],

      eqeqeq: 'error',

      // We work with the DOM enough that this rule also became tiresome.
      'unicorn/no-null': 'off',

      // We want to steer people toward using real member privacy.
      'no-underscore-dangle': [
        'error',
        { enforceInClassFields: true, enforceInMethodNames: true },
      ],

      'prefer-const': 'error',
      'no-implicit-coercion': 'error',
      'no-console': 'error',
      'import/order': 'error',

      // TypeScript handles these for us. Plus they're a bear to configure.
      'import/named': 'off',
      'import/no-unresolved': 'off',

      // It sometimes helps readability to do a default import and call methods
      // off it. Plus this rule isn't autofixable. So we'd have to make a ton
      // of manual changes.
      'import/no-named-as-default-member': 'off',

      // We use Lit's `classMap` often enough that disabling this rule ad hoc
      // became tiresome.
      'unicorn/no-keyword-prefix': 'off',

      // We understand Unicorn's justification for this but found it hurts
      // readability more than it helps searchability.
      //
      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-anonymous-default-export.md
      'unicorn/no-anonymous-default-export': 'off',

      // https://github.com/CrowdStrike/glide-core/pull/551#discussion_r1892759742
      'unicorn/prefer-global-this': 'off',

      'no-restricted-imports': [
        'error',
        {
          paths: [
            // See CONTRIBUTING.md for detailed reasoning
            {
              name: 'lit/decorators.js',
              importNames: [
                'query',
                'queryAll',
                'queryAsync',
                'queryAssignedElements',
                'queryAssignedNodes',
              ],
              message:
                'Please use a Lit `ref`, `this.querySelector()`, or `this.querySelectorAll()` instead of a query decorator.',
            },
            // According to https://github.com/lit/lit?tab=readme-ov-file#packages,
            // we should be importing everything from lit rather than lit-html/lit-element.
            {
              name: 'lit-html',
              message: "Please import from 'lit' rather than 'lit-html'.",
            },
            {
              name: 'lit-element',
              message: "Please import from 'lit' rather than 'lit-element'.",
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          // See CONTRIBUTING.md for our reasoning.
          selector: `CallExpression[callee.name='describe']`,
          message:
            "Please use separate files rather than the 'describe' block.",
        },
      ],
      'sort-class-members/sort-class-members': [
        2,
        {
          order: [
            '[public-static-properties]',
            '[public-@property]',
            '[public-properties]',
            '[public-accessors]',
            '[public-arrow-function-expressions]',
            '[public-methods]',
            '[public-static-methods]',

            'constructor',

            '[private-static-properties]',
            '[private-@state]',
            '[private-properties]',
            '[private-accessors]',
            '[private-arrow-function-expressions]',
            '[private-methods]',
          ],
          accessorPairPositioning: 'getThenSet',
          groups: {
            'public-static-properties': [
              { type: 'property', sort: 'alphabetical', static: true },
            ],
            'public-@property': [
              {
                groupByDecorator: '/property/',
                sort: 'alphabetical',
              },
            ],
            'public-properties': [{ type: 'property', sort: 'alphabetical' }],
            'public-accessors': [{ kind: 'accessor' }],
            'public-methods': [{ type: 'method', sort: 'alphabetical' }],
            'public-arrow-function-expressions': [
              {
                type: 'property',
                propertyType: 'ArrowFunctionExpression',
                sort: 'alphabetical',
              },
            ],
            'public-static-methods': [
              { type: 'method', sort: 'alphabetical', static: true },
            ],
            'private-@state': [
              {
                type: 'property',
                groupByDecorator: '/state/',
                accessibility: 'private',
                sort: 'alphabetical',
              },
            ],
            'private-properties': [
              { type: 'property', private: true, sort: 'alphabetical' },
            ],
            'private-accessors': [{ kind: 'accessor', private: true }],
            'private-arrow-function-expressions': [
              {
                type: 'property',
                private: true,
                propertyType: 'ArrowFunctionExpression',
                sort: 'alphabetical',
              },
            ],
            'private-methods': [
              { type: 'method', private: true, sort: 'alphabetical' },
            ],
          },
        },
      ],
    },
  },
  {
    files: [
      '*.ts',
      'src/*.test.ts',
      'src/*.test.*.ts',
      'src/*.*.test.*.ts',
      '.storybook/**/*',
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['*.js', '.storybook/**/*'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: [
      '**/*.js',
      'src/**/*.test.ts',
      'src/*.test.*.ts',
      'src/*.*.test.*.ts',
    ],
    // These rules don't apply to JavaScript, and in tests they're annoying
    // due to how loosely Playwright's `expect` chains are typed.
    ...typescript.configs.disableTypeChecked,
  },
  {
    // Components exist to be extended: with no styles of their own, a consumer
    // restyles one by subclassing it and setting `styles`.
    files: ['src/*.ts'],
    rules: {
      'slab/no-protected-keyword': 'off',
    },
  },
  {
    files: ['src/**/*.test.ts', 'src/*.test.*.ts', 'src/*.*.test.*.ts'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',

      'slab/consistent-test-fixture-variable-declarator': 'error',
      'slab/public-member-return-type': 'off',
      'slab/public-getter-default-comment': 'off',
      'slab/event-dispatch-from-this': 'off',
      'slab/string-event-name': 'off',
      'slab/slot-type-comment': 'off',
      'slab/public-property-expression-type': 'off',
    },
  },
  {
    ...playwright.configs['flat/recommended'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    files: [
      'src/*.test.*.ts',
      'src/library/*.test.ts',
      'src/eslint/rules/*.test.ts',
      'src/server/*.test.ts',
      'src/stylelint/rules/*.test.ts',
    ],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-commented-out-tests': 'error',
      'playwright/no-get-by-title': 'error',
      'playwright/no-hooks': 'error',
      'playwright/no-slowed-test': 'error',
      'playwright/no-useless-await': 'error',
      'playwright/prefer-comparison-matcher': 'error',
      'playwright/prefer-equality-matcher': 'error',
      'playwright/prefer-hooks-in-order': 'error',
      'playwright/prefer-hooks-on-top': 'error',
      'playwright/prefer-locator': 'error',
      'playwright/prefer-lowercase-title': 'error',
      'playwright/prefer-strict-equal': 'error',
      'playwright/prefer-to-be': 'error',
      'playwright/prefer-to-contain': 'error',
      'playwright/prefer-to-have-count': 'error',
      'playwright/prefer-to-have-length': 'error',
      'playwright/require-hook': 'error',
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
      'playwright/valid-test-tags': [
        'error',
        {
          allowedTags: [
            '@accessibility',
            '@eslint',
            '@forms',
            '@keyboard',
            '@miscellaneous',
            '@mouse',
            '@stylelint',
          ],
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      'slab/always-tag-tests': 'error',
      'slab/one-tag-per-test': 'error',
      'slab/no-test-fail': 'error',
      'slab/no-test-fixme': 'error',
      'slab/no-to-contain-class': 'error',
      'slab/no-to-have-class': 'error',
      'slab/no-tags-in-test-names': 'error',
      'slab/use-extended-playwright': 'error',
      'lit-a11y/click-events-have-key-events': 'off',
    },
  },
  {
    ...playwright.configs['flat/recommended'],
    files: ['src/*.test.*.ts', 'src/*.test.*.*.ts'],
    rules: {
      'slab/test-tag-matches-suite': 'error',
    },
  },
  {
    // One-off elements that exist only to be driven by a test. They're not
    // components, so the rules that shape a component's public surface don't
    // apply.
    files: ['src/playwright/elements/*.ts'],
    rules: {
      'slab/slot-type-comment': 'off',
      'slab/public-member-return-type': 'off',
    },
  },
  {
    files: ['src/library/**'],
    rules: {
      'slab/public-member-return-type': 'off',
      'slab/public-getter-default-comment': 'off',
    },
  },
]);
