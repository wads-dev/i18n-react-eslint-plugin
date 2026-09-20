import assert from 'node:assert/strict';
import test from 'node:test';
import { ESLint } from 'eslint';
import parser from '@typescript-eslint/parser';
import plugin from '../src/index.js';

test('exports flat and legacy recommended configs', () => {
  assert.equal(plugin.meta.name, '@wads.dev/i18n-react-eslint-plugin');
  assert.equal(
    plugin.configs.recommended.rules[
      '@wads.dev/i18n-react-eslint-plugin/no-restricted-i18n-import'
    ],
    'error',
  );
  assert.equal(
    plugin.configs.recommended.rules['@wads.dev/i18n-react-eslint-plugin/no-untranslated-string'],
    'error',
  );
  assert.equal(
    plugin.configs['flat/recommended'].rules[
      'i18n-jsx/no-restricted-i18n-import'
    ],
    'error',
  );
  assert.equal(
    plugin.configs['flat/recommended'].rules['i18n-jsx/no-untranslated-string'],
    'error',
  );
  assert.equal(plugin.configs['flat/recommended'].plugins['i18n-jsx'], plugin);
});

test('runs both recommended rules through ESLint 9 Flat Config', async () => {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.tsx'],
        languageOptions: {
          parser,
          parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
        },
        ...plugin.configs['flat/recommended'],
      },
    ],
  });

  const [result] = await eslint.lintText(
    "import ptBR from './ptBR'; const Page = () => <Text>Create account</Text>;",
    { filePath: 'src/feature/i18n/en.tsx' },
  );

  assert.deepEqual(
    result.messages.map((message) => message.ruleId).sort(),
    ['i18n-jsx/no-restricted-i18n-import', 'i18n-jsx/no-untranslated-string'],
  );
});
