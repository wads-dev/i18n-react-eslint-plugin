'use strict';

const DEFAULT_IGNORED_ATTRIBUTES = [
  'className',
  'id',
  'key',
  'name',
  'role',
  'src',
  'href',
  'target',
  'rel',
  'type',
  'style',
  'testID',
  'nativeID',
  'textAlign',
  'fontSize',
  'strokeDasharray',
];

const DEFAULT_FORCED_ATTRIBUTES = [
  'accessibilityHint',
  'accessibilityLabel',
  'aria-description',
  'aria-label',
  'buttonDetailsText',
  'description',
  'detailsButtonText',
  'filterName',
  'helperText',
  'label',
  'message',
  'placeholder',
  'subtitle',
  'text',
  'title',
  'titleTemplate',
];

const DEFAULT_IGNORED_FUNCTIONS = ['cn', 'cva', 'describe', 'it', 'require', 'test'];
const DEFAULT_IGNORED_PROPERTIES = [];

const CSS_UTILITY_PREFIXES =
  /^(bg|text|border|ring|shadow|rounded|w|h|m[trblxy]?|p[trblxy]?|gap|space-[xy]|z|inset|top|left|right|bottom|opacity|overflow|object|justify|items|content|place|self|font|leading|tracking|whitespace|break|align|col|row|grid|flex|inline|block|hidden|sr-only|cursor|select|order|origin|scale|rotate|translate|skew|duration|ease|transition|container)-/;

const VARIANT_PREFIX =
  /^(?:!|(?:dark|sm|md|lg|xl|2xl|motion-safe|motion-reduce|rtl|ltr|aria)(?:-[a-z]+)?:)+/;

const CSS_BASE_TOKENS = new Set([
  'antialiased',
  'flex',
  'hidden',
  'italic',
  'items-center',
  'items-end',
  'items-start',
  'justify-between',
  'justify-center',
  'justify-end',
  'justify-start',
  'lowercase',
  'rounded',
  'sr-only',
  'truncate',
  'uppercase',
]);

const noUntranslatedString = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow untranslated user-facing string literals.',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          ignoredAttributes: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
          ignoredFunctions: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
          ignoredProperties: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
          forcedAttributes: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
        },
      },
    ],
    messages: {
      noUntranslated:
        "Missing translation for '{{value}}' ({{context}}). Move user-facing text to the i18n catalog.",
    },
  },

  create(context) {
    const options = context.options[0] ?? {};
    const ignoredAttributes = new Set([
      ...DEFAULT_IGNORED_ATTRIBUTES,
      ...(options.ignoredAttributes ?? []),
    ]);
    const forcedAttributes = new Set([
      ...DEFAULT_FORCED_ATTRIBUTES,
      ...(options.forcedAttributes ?? []),
    ]);
    const ignoredFunctions = new Set([
      ...DEFAULT_IGNORED_FUNCTIONS,
      ...(options.ignoredFunctions ?? []),
    ]);
    const ignoredProperties = new Set([
      ...DEFAULT_IGNORED_PROPERTIES,
      ...(options.ignoredProperties ?? []),
    ]);
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    function getAncestors(node) {
      if (typeof sourceCode.getAncestors === 'function') {
        return sourceCode.getAncestors(node);
      }

      return context.getAncestors?.() ?? [];
    }

    function isInsideIgnoredFunction(node) {
      return getAncestors(node).some((ancestor) => {
        if (ancestor.type !== 'CallExpression') return false;
        return ignoredFunctions.has(getCalleeName(ancestor.callee));
      });
    }

    function report(node, rawValue, force = false) {
      const value = rawValue.trim();
      if (!value || value.length === 1) return;
      if (!force && !isHumanReadableString(value)) return;

      const parent = node.parent;
      const attributeSuffix =
        parent?.type === 'JSXAttribute' ? `:${getJsxAttributeName(parent.name)}` : '';
      const contextInfo = `${node.type} in ${parent?.type ?? 'unknown'}${attributeSuffix}`;

      context.report({
        node,
        messageId: 'noUntranslated',
        data: { context: contextInfo, value },
      });
    }

    return {
      JSXText(node) {
        report(node, node.value, true);
      },

      Literal(node) {
        if (typeof node.value !== 'string' || !node.value.trim() || !node.parent) return;
        if (isInsideIgnoredFunction(node)) return;

        const parent = node.parent;
        if (parent.type === 'Property' && parent.key === node && !parent.computed) return;
        if (
          parent.type === 'ImportDeclaration' ||
          parent.type === 'ExportNamedDeclaration' ||
          parent.type === 'ExportAllDeclaration'
        ) {
          return;
        }

        if (parent.type === 'JSXAttribute') {
          const attributeName = getJsxAttributeName(parent.name);
          if (
            ignoredAttributes.has(attributeName) ||
            attributeName.startsWith('data-')
          ) {
            return;
          }

          report(node, node.value, forcedAttributes.has(attributeName));
          return;
        }

        if (parent.type === 'Property' && parent.value === node) {
          if (ignoredProperties.has(getPropertyName(parent))) return;
          report(node, node.value);
        }
      },

      TemplateLiteral(node) {
        if (!node.parent || isInsideIgnoredFunction(node)) return;

        const staticText = node.quasis.map((quasi) => quasi.value.cooked ?? '').join(' ').trim();
        if (!staticText) return;

        const parent = node.parent;
        if (parent.type === 'Property' && parent.value === node) {
          if (ignoredProperties.has(getPropertyName(parent))) return;
          report(node, staticText);
          return;
        }

        if (parent.type === 'JSXExpressionContainer') {
          const attribute = parent.parent;
          if (attribute?.type === 'JSXAttribute') {
            const attributeName = getJsxAttributeName(attribute.name);
            if (
              ignoredAttributes.has(attributeName) ||
              attributeName.startsWith('data-')
            ) {
              return;
            }
            report(node, staticText, forcedAttributes.has(attributeName));
            return;
          }

          report(node, staticText);
        }
      },
    };
  },
};

const noRestrictedI18nImport = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Restrict imports and re-exports inside i18n catalog files.',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allowedImportPatterns: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
        },
      },
    ],
    messages: {
      restrictedI18nImport:
        "Import '{{source}}' is not allowed in an i18n catalog. Import './base', '@wads.dev/i18n-*', or a composed catalog with the same filename.",
    },
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!isI18nFile(filename)) return {};

    const options = context.options[0] ?? {};
    const currentCatalog = getFileStem(filename);
    const allowedImportPatterns = (options.allowedImportPatterns ?? []).map(
      (pattern) => new RegExp(pattern),
    );

    function checkSource(node) {
      if (!node.source || typeof node.source.value !== 'string') return;
      const source = node.source.value;
      if (
        isAllowedI18nImport({
          allowedImportPatterns,
          currentCatalog,
          source,
        })
      ) {
        return;
      }

      context.report({
        node: node.source,
        messageId: 'restrictedI18nImport',
        data: { source },
      });
    }

    return {
      ExportAllDeclaration: checkSource,
      ExportNamedDeclaration: checkSource,
      ImportDeclaration: checkSource,
    };
  },
};

function getCalleeName(callee) {
  if (!callee) return '';
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type === 'MemberExpression' && !callee.computed) {
    return callee.property?.name ?? '';
  }
  return '';
}

function getJsxAttributeName(name) {
  if (!name) return '';
  if (name.type === 'JSXIdentifier') return name.name;
  if (name.type === 'JSXNamespacedName') {
    return `${name.namespace.name}:${name.name.name}`;
  }
  return '';
}

function getPropertyName(property) {
  if (!property?.key) return '';
  if (property.key.type === 'Identifier' && !property.computed) return property.key.name;
  if (property.key.type === 'Literal') return String(property.key.value);
  return '';
}

function getFileStem(filePath) {
  const filename = filePath.split(/[\\/]/).pop() ?? '';
  return filename.replace(/\.[^.]+$/, '');
}

function isI18nFile(filePath) {
  return /(?:^|[\\/])i18n[\\/][^\\/]+\.[^\\/]+$/.test(filePath);
}

function isAllowedI18nImport({ allowedImportPatterns, currentCatalog, source }) {
  if (source === './base' || source.startsWith('./base.')) return true;
  if (source.startsWith('@wads.dev/i18n-')) return true;
  if (
    /(?:^|[\\/])i18n[\\/][^\\/]+(?:\.[^\\/]*)?$/.test(source) &&
    getFileStem(source) === currentCatalog
  ) {
    return true;
  }
  return allowedImportPatterns.some((pattern) => pattern.test(source));
}

function isHumanReadableString(rawValue) {
  const value = rawValue.trim();

  if (!/\p{L}/u.test(value)) return false;
  if (/^[A-Za-z_$][\w$.-]*\s*=\s*["'`]/.test(value)) return false;

  if (
    !/\s/.test(value) &&
    value.length >= 24 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value)
  ) {
    return false;
  }

  if (
    /^(?:calc|circle|clamp|conic-gradient|ellipse|hsl|hsla|inset|linear-gradient|matrix|matrix3d|min|max|polygon|radial-gradient|rgb|rgba|rotate|scale|translate|var)\(/i.test(
      value,
    )
  ) {
    return false;
  }
  if (
    /\b(?:hsl|hsla|rgb|rgba|var)\(/i.test(value) &&
    /(?:^|\s)-?\d+(?:\.\d+)?(?:px|r?em|%)(?:\s|$)/i.test(value)
  ) {
    return false;
  }
  if (value.startsWith('[') || value.startsWith('{')) return false;
  if (/^[A-Z_]+$/.test(value)) return false;

  return (
    /[áàâãéèêíïóôõöúüç]/i.test(value) ||
    (value.split(/\s+/).length > 1 && !isLikelyClassList(value)) ||
    (/^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇ]/.test(value) && value.toUpperCase() !== value)
  );
}

function isLikelyClassList(value) {
  const tokens = value.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  const cssLikeTokens = tokens.filter(isCssUtilityToken).length;
  return cssLikeTokens / tokens.length >= 0.15;
}

function isCssUtilityToken(rawToken) {
  const token = rawToken.replace(VARIANT_PREFIX, '');
  return !token || CSS_BASE_TOKENS.has(token) || CSS_UTILITY_PREFIXES.test(token);
}

const plugin = {
  meta: {
    name: '@wads.dev/i18n-react-eslint-plugin',
    version: '0.0.1',
  },
  rules: {
    'no-restricted-i18n-import': noRestrictedI18nImport,
    'no-untranslated-string': noUntranslatedString,
  },
  configs: {},
};

plugin.configs.recommended = {
  plugins: ['@wads.dev/i18n-react-eslint-plugin'],
  rules: {
    '@wads.dev/i18n-react-eslint-plugin/no-restricted-i18n-import': 'error',
    '@wads.dev/i18n-react-eslint-plugin/no-untranslated-string': 'error',
  },
};

plugin.configs['flat/recommended'] = {
  plugins: {
    'i18n-jsx': plugin,
  },
  rules: {
    'i18n-jsx/no-restricted-i18n-import': 'error',
    'i18n-jsx/no-untranslated-string': 'error',
  },
};

module.exports = plugin;
