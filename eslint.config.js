import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import { reactRefresh } from 'eslint-plugin-react-refresh'
import prettierConfig from 'eslint-config-prettier/flat'

export default tseslint.config(
  // Глобальные исключения
  { ignores: ['dist/**', 'node_modules/**', 'src/api-client/**', 'server/generated/**'] },

  // TypeScript: основные правила typescript-eslint
  ...tseslint.configs.recommended,

  // React: хуки + Fast Refresh (Vite HMR)
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh.plugin,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, allowCompoundComponents: true },
      ],
    },
  },

  // Всегда последним: отключает правила ESLint, конфликтующие с Prettier
  prettierConfig,
)
