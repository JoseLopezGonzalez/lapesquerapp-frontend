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
      // React Compiler rules (react-hooks v7) — downgraded to warn because the project
      // uses React 19-rc canary but does NOT enable the React Compiler.
      // Restore to "error" if/when the React Compiler is adopted.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
];
