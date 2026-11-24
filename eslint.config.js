import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'pocketbase/pb_public/', 'pocketbase/pb_data/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser } },
  },
  {
    files: ['vite.config.js', 'eslint.config.js', 'scripts/**/*.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['pocketbase/pb_migrations/**/*.js'],
    languageOptions: { sourceType: 'script', globals: { migrate: 'readonly', Collection: 'readonly' } },
  },
];
