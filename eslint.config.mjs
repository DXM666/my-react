import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
	{
		files: [
			'packages/**/*.{js,jsx,ts,tsx}',
			'examples/**/*.{js,jsx,ts,tsx}'
		],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module'
			}
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
			prettier: prettier
		},
		rules: {
			...tsPlugin.configs.recommended.rules,
			...eslintConfigPrettier.rules,
			'prettier/prettier': [
				'error',
				{
					endOfLine: 'auto'
				}
			],
			'no-case-declarations': 'off',
			'no-constant-condition': 'off',
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-unused-expressions': 'off'
		}
	}
];
