import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import replace from '@rollup/plugin-replace';

const distPath = path.resolve(__dirname, '../dist/node_modules');

export default defineConfig({
	plugins: [
		react(),
		replace({
			__DEV__: true,
			preventAssignment: true
		})
	],
	resolve: {
		alias: {
			react: path.resolve(distPath, 'react'),
			'react-dom': path.resolve(distPath, 'react-dom')
		}
	},
	root: path.resolve(__dirname, '../examples/demo'),
	optimizeDeps: {
		force: true
		// entries: [
		// 	'react',
		// 	'react/jsx-runtime',
		// 	'react/jsx-dev-runtime'
		// ]
	},
	server: {
		open: true
	}
});
