import nextConfig from 'eslint-config-next/core-web-vitals';

export default [
  ...nextConfig,
  {
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: "Property[key.name='queryKey'] > ArrayExpression",
          message:
            'Usa una factory de queryKeys.ts en lugar de un array literal. Ver src/lib/routes/queryKeys.ts',
        },
      ],
    },
  },
];
