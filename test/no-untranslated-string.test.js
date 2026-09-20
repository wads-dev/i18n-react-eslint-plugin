import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import plugin from '../src/index.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    parser,
    parserOptions: {
      ecmaFeatures: { jsx: true },
      sourceType: 'module',
    },
  },
});

ruleTester.run(
  'no-untranslated-string',
  plugin.rules['no-untranslated-string'],
  {
    valid: [
      'const Page = () => <Text>{lang.title}</Text>;',
      'const Page = () => <View className="flex items-center justify-between" />;',
      'const Page = () => <Icon accessibilityLabel={lang.close} name="close" />;',
      "const Page = () => <ComponentExample name='BrandLogo' />;",
      "const technical = { id: 'payment-released', status: 'available' };",
      "const theme = { overlay: 'rgba(15, 23, 42, 0.18)' };",
      "const theme = { shadow: '0 18px 42px rgba(13, 16, 22, 0.12)' };",
      'const Page = ({ index }) => <Text>{`${index}/3`}</Text>;',
      'const Page = ({ name }) => <Text>{`<${name} />`}</Text>;',
      'const Page = ({ type }) => <Text>{`type=\"${type}\"`}</Text>;',
      "const Page = () => <Link href='/settings'>{lang.settings}</Link>;",
      "describe('Page', () => { const title = 'Visible test description'; });",
      {
        code: "const Page = () => <Button tooltip='Technical name' />;",
        options: [{ ignoredAttributes: ['tooltip'] }],
      },
      {
        code: "const person = { holder: 'John Doe' };",
        options: [{ ignoredProperties: ['holder'] }],
      },
    ],
    invalid: [
      {
        code: 'const Page = () => <Text>Create account</Text>;',
        errors: [{ messageId: 'noUntranslated' }],
      },
      {
        code: "const Page = () => <Button label='Continue' />;",
        errors: [{ messageId: 'noUntranslated' }],
      },
      {
        code: "const Page = () => <Button accessibilityLabel='close' />;",
        errors: [{ messageId: 'noUntranslated' }],
      },
      {
        code: "const Page = () => <FlowShortcut description='summary' />;",
        errors: [{ messageId: 'noUntranslated' }],
      },
      {
        code: "const option = { label: 'São Paulo', value: 'sp' };",
        errors: [{ messageId: 'noUntranslated' }],
      },
      {
        code: 'const Page = ({ name }) => <Text>{`Welcome ${name}`}</Text>;',
        errors: [{ messageId: 'noUntranslated' }],
      },
      {
        code: 'const item = { title: `Welcome ${name}` };',
        errors: [{ messageId: 'noUntranslated' }],
      },
      {
        code: "const Page = () => <Button caption='continue' />;",
        options: [{ forcedAttributes: ['caption'] }],
        errors: [{ messageId: 'noUntranslated' }],
      },
      {
        code: "const Page = () => <Button accessibilityLabel='close' caption='continue' />;",
        options: [{ forcedAttributes: ['caption'] }],
        errors: [
          { messageId: 'noUntranslated' },
          { messageId: 'noUntranslated' },
        ],
      },
    ],
  },
);
