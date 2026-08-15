import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.worktrees/**',
    'VizTR-OS/**',
    'babylon_XR_World/**',
    'Extended Features/**',
    'VizAgents(Opencode-Hermes-Gravity-)/**',
    'node_modules/**',
  ]),
  {
    files: ['next.config.js', 'local/**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
])

export default eslintConfig
