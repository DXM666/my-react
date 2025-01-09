import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import replace from '@rollup/plugin-replace';

const resolvePkgPath = (pkgName, isDist) => {
	if (isDist) {
		return `${distPath}/${pkgName}`;
	}
	return `${pkgPath}/${pkgName}`;
};

const distPath = path.resolve(__dirname, '../dist/node_modules');
const pkgPath = path.resolve(__dirname, '../packages');

export default defineConfig({
	plugins: [
		react(),
		replace({
			__DEV__: true,
			preventAssignment: true
		})
	],
	resolve: {
		alias: [
			{
				find: 'react',
				replacement: resolvePkgPath('react')
			},
			{
				find: 'react-dom',
				replacement: resolvePkgPath('react-dom')
			},
			{
				find: 'hostConfig',
				replacement: path.resolve(
					resolvePkgPath('react-dom'),
					'./src/hostConfig.ts'
				)
			}
		]
	},
	sourceMap: true,
	root: path.resolve(__dirname, '../examples/demo'),
	optimizeDeps: {
		force: true
	},
	server: {
		open: true
	}
});
