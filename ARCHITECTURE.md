# i18n ESLint JSX Architecture

`@wads.dev/i18n-react-eslint-plugin` is a framework-agnostic ESLint plugin for detecting
untranslated user-facing strings in JavaScript, TypeScript and JSX syntax.

## Boundaries

- The package detects likely user-facing literals; it does not know how a
  consuming application stores or resolves translations.
- Catalog files may import their local `base`, `@wads.dev/i18n-*`, or another
  composed catalog with the same filename. Cross-language imports are always
  rejected unless a consuming project explicitly allows them.
- The rule must not import React, React Native, Expo or an i18n runtime.
- ESLint is a peer dependency. The package has no runtime dependencies.
- False-positive suppression belongs to explicit rule options or narrow,
  reusable syntax heuristics.
- Project-specific file exclusions, such as translation catalogs and tests,
  belong to the consuming project's ESLint config.

## Compatibility

The public package supports both ESM imports and CommonJS `require`.
The rule supports ESLint 8.57 through ESLint 9 and uses the ESLint 9
`SourceCode#getAncestors` API with an ESLint 8 fallback.

## Origin

The initial heuristic is derived from the Brick web application's local
`no-untranslated-string` rule. Brick-specific debugging, error baselines and
unrelated local rules are intentionally excluded from this package.
