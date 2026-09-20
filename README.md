# @wads.dev/i18n-react-eslint-plugin

ESLint rules for detecting untranslated, user-facing strings in JavaScript,
TypeScript, and JSX, and for keeping i18n catalog imports deliberate.

## Requirements

- Node.js 18 or later
- ESLint 9 with Flat Config (the supported configuration model).

## Installation

```sh
npm install --save-dev @wads.dev/i18n-react-eslint-plugin eslint
```

## ESLint 9 Flat Config

Use the bundled recommended configuration in `eslint.config.js`:

```js
import i18nJsx from '@wads.dev/i18n-react-eslint-plugin';

export default [
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    ignores: ['src/**/i18n/**', 'src/**/*.test.*', 'src/**/*.spec.*'],
    ...i18nJsx.configs['flat/recommended'],
  },
];
```

The recommended config enables both rules. To configure them independently:

```js
import i18nJsx from '@wads.dev/i18n-react-eslint-plugin';

export default [
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    plugins: { 'i18n-jsx': i18nJsx },
    rules: {
      'i18n-jsx/no-untranslated-string': 'error',
      'i18n-jsx/no-restricted-i18n-import': 'error',
    },
  },
];
```

## Rules

### `i18n-jsx/no-untranslated-string`

Reports likely user-facing, untranslated string literals in JSX, JSX attributes,
object properties, and template literals. Import paths, object keys, data
attributes, common technical attributes, known utility-class lists, and strings
inside `describe`, `it`, and `test` calls are ignored.

**Invalid:**

```jsx
const screen = <Button label="Continue">Create account</Button>;
const option = { label: 'São Paulo', value: 'sp' };
```

**Valid:**

```jsx
const screen = <Button label={messages.continue}>{messages.createAccount}</Button>;
const layout = <View className="flex items-center justify-between" />;
const request = { id: 'payment-released', status: 'available' };
```

#### Options

All array options extend their built-in defaults; they do not replace them.

| Option | Type | Purpose |
| --- | --- | --- |
| `ignoredAttributes` | `string[]` | JSX attributes whose literal values are never reported. |
| `ignoredFunctions` | `string[]` | Call names whose nested string literals are ignored. |
| `ignoredProperties` | `string[]` | Object properties whose literal values are ignored. |
| `forcedAttributes` | `string[]` | JSX attributes that are always treated as user-facing when they contain a non-empty literal. |

```js
{
  'i18n-jsx/no-untranslated-string': ['error', {
    ignoredAttributes: ['analyticsName'],
    ignoredFunctions: ['storiesOf'],
    ignoredProperties: ['analyticsCategory'],
    forcedAttributes: ['emptyStateText'],
  }],
}
```

### `i18n-jsx/no-restricted-i18n-import`

Restricts imports and re-exports only inside files directly under an `i18n/`
directory. It allows local `./base` imports, packages named
`@wads.dev/i18n-*`, and composition from another catalog with the same filename
(for example, `fr.ts` importing another `fr.ts`). Other imports are reported.

**Invalid** (in `src/feature/i18n/en.ts`):

```ts
import ptBR from './ptBR';
export { default } from '../shared/messages';
```

**Valid** (in `src/feature/i18n/en.ts`):

```ts
import type Translation from './base';
import feature from '../another-feature/i18n/en';
import { createCatalog } from '@wads.dev/i18n-ts';
```

#### Options

| Option | Type | Purpose |
| --- | --- | --- |
| `allowedImportPatterns` | `string[]` | Regular-expression source strings for additional allowed module specifiers. |

```js
{
  'i18n-jsx/no-restricted-i18n-import': ['error', {
    allowedImportPatterns: ['^@project/i18n-tools(?:/|$)'],
  }],
}
```

## Development

```sh
npm ci
npm run ci
npm run verify:release
```

`verify:release` runs syntax validation, linting, tests, and `npm pack --dry-run`.
