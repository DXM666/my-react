import { defineConfig } from 'vite'
import path from 'path'

const packagePath = path.resolve(__dirname, '../packages')
const distPath = path.resolve(__dirname, '../dist')

// 获取包路径
const resolvePkgPath = (pkgName, isDist) => {
    if (isDist) {
        return `${distPath}/${pkgName}`
    }
    return `${packagePath}/${pkgName}`
}

export default defineConfig({
    build: {
        lib: {
            entry: {
                react: path.resolve(packagePath, 'react/index.ts'),
                shared: path.resolve(packagePath, 'shared/index.ts')
            },
            formats: ['es'],
            fileName: (format, entryName) => `${entryName}/${entryName}.js`
        },
        rollupOptions: {
            external: ['react', 'react-dom'],
            output: {
                dir: distPath
            }
        },
        outDir: distPath,
        minify: false,
        sourcemap: true
    }
})
