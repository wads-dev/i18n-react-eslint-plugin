import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import plugin from '../src/index.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    parser,
    parserOptions: { sourceType: 'module' },
  },
});

ruleTester.run(
  'no-restricted-i18n-import',
  plugin.rules['no-restricted-i18n-import'],
  {
    valid: [
      {
        filename: 'src/feature/i18n/en.ts',
        code: "import type Translation from './base';",
      },
      {
        filename: 'src/feature/i18n/base.ts',
        code: "import type { Translation } from '@wads.dev/i18n-ts';",
      },
      {
        filename: 'src/module/i18n/fr.ts',
        code: "import feature from '../feature/i18n/fr';",
      },
      {
        filename: 'src/module/i18n/base.ts',
        code: "import type FeatureTranslation from '../feature/i18n/base';",
      },
      {
        filename: 'src/feature/component.ts',
        code: "import helper from './helper';",
      },
      {
        filename: 'src/feature/i18n/en.ts',
        code: "import helper from '@project/i18n-helper';",
        options: [{ allowedImportPatterns: ['^@project/i18n-helper$'] }],
      },
    ],
    invalid: [
      {
        filename: 'src/feature/i18n/en.ts',
        code: "import ptBR from './ptBR';",
        errors: [{ messageId: 'restrictedI18nImport' }],
      },
      {
        filename: 'src/module/i18n/zh.ts',
        code: "import feature from '../feature/i18n/en';",
        errors: [{ messageId: 'restrictedI18nImport' }],
      },
      {
        filename: 'src/feature/i18n/es.ts',
        code: "export { default } from './ptBR';",
        errors: [{ messageId: 'restrictedI18nImport' }],
      },
      {
        filename: 'src/feature/i18n/fr.ts',
        code: "import base from './ptBR';",
        errors: [{ messageId: 'restrictedI18nImport' }],
      },
      {
        filename: 'src/feature/i18n/en.ts',
        code: "import helper from '../helper';",
        errors: [{ messageId: 'restrictedI18nImport' }],
      },
      {
        filename: 'src/feature/i18n/en.ts',
        code: "import React from 'react';",
        errors: [{ messageId: 'restrictedI18nImport' }],
      },
    ],
  },
);
